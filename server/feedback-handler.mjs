const DESTINATARIO_PADRAO = 'listeecompre@gmail.com';
const REMETENTE_TESTE = 'Liste & Compre <onboarding@resend.dev>';

function responder(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

async function lerBody(req) {
  if (req.body !== undefined) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }

  const chunks = [];
  let tamanho = 0;
  for await (const chunk of req) {
    tamanho += Buffer.byteLength(chunk);
    if (tamanho > 12_000) throw new Error('CORPO_GRANDE');
    chunks.push(Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function textoSeguro(valor, limite) {
  return String(valor ?? '').trim().slice(0, limite);
}

function origemPermitida(req, env) {
  const origem = req.headers.origin;
  if (typeof origem !== 'string') return false;

  const permitidas = new Set();
  if (env.APP_ORIGIN) permitidas.add(env.APP_ORIGIN);
  if (env.VERCEL_URL) permitidas.add(`https://${env.VERCEL_URL}`);
  if (env.VERCEL_BRANCH_URL) permitidas.add(`https://${env.VERCEL_BRANCH_URL}`);

  return permitidas.has(origem);
}

export function createFeedbackHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async function feedbackHandler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return responder(res, 405, { ok: false, error: 'Método não permitido.' });
    }

    if (!origemPermitida(req, env)) {
      return responder(res, 403, { ok: false, error: 'Origem não permitida.' });
    }

    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? '')) {
      return responder(res, 415, { ok: false, error: 'Envie os dados em JSON.' });
    }

    if (!env.RESEND_API_KEY) {
      console.warn('[Feedback] RESEND_API_KEY não configurada.');
      return responder(res, 503, { ok: false, error: 'Serviço de e-mail indisponível.' });
    }

    try {
      const body = await lerBody(req);
      const tipo = textoSeguro(body?.tipo || 'Teste', 40);
      const mensagem = textoSeguro(body?.mensagem, 5000);
      const emailUsuario = textoSeguro(body?.email, 254);
      const navegador = textoSeguro(body?.navegador, 500);

      if (!mensagem) {
        return responder(res, 400, { ok: false, error: 'Escreva uma mensagem.' });
      }

      const assunto = `[Liste & Compre] ${tipo}`;
      const texto = [
        `Tipo: ${tipo}`,
        emailUsuario ? `E-mail do usuário: ${emailUsuario}` : null,
        navegador ? `Navegador: ${navegador}` : null,
        `Data: ${new Date().toISOString()}`,
        '',
        'Mensagem:',
        mensagem,
      ]
        .filter((linha) => linha !== null)
        .join('\n');

      const resposta = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: REMETENTE_TESTE,
          to: [DESTINATARIO_PADRAO],
          subject: assunto,
          text: texto,
        }),
      });

      const resultado = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        console.warn('[Feedback] Resend recusou o envio:', resposta.status, resultado?.name ?? 'erro');
        return responder(res, 502, {
          ok: false,
          error: 'Não foi possível enviar a mensagem agora.',
          code: resultado?.name ?? 'RESEND_ERROR',
        });
      }

      return responder(res, 200, { ok: true, id: resultado?.id ?? null });
    } catch (error) {
      const corpoGrande = error instanceof Error && error.message === 'CORPO_GRANDE';
      return responder(res, corpoGrande ? 413 : 400, {
        ok: false,
        error: corpoGrande ? 'Mensagem muito grande.' : 'Dados inválidos.',
      });
    }
  };
}

export default createFeedbackHandler();
