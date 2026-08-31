import { aplicarRateLimit } from './rate-limit.mjs';

const DESTINATARIO_PADRAO = 'listeecompre@gmail.com';
const REMETENTE_TESTE = 'Liste & Compre <onboarding@resend.dev>';
const ORIGEM_PRODUCAO = 'https://listeecompre.vercel.app';
const TIPOS = new Set(['Elogio', 'Reclamação', 'Bug']);

function responder(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}
async function lerBody(req) {
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > 12_000) throw new Error('CORPO_GRANDE');
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  const chunks = []; let tamanho = 0;
  for await (const chunk of req) { tamanho += Buffer.byteLength(chunk); if (tamanho > 12_000) throw new Error('CORPO_GRANDE'); chunks.push(Buffer.from(chunk)); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
function origemPermitida(req, env) {
  const origem = req.headers.origin; if (typeof origem !== 'string') return false;
  const permitidas = new Set([ORIGEM_PRODUCAO]);
  if (env.APP_ORIGIN) permitidas.add(env.APP_ORIGIN.replace(/\/$/, ''));
  if (env.VERCEL_URL) permitidas.add(`https://${env.VERCEL_URL}`);
  if (env.VERCEL_BRANCH_URL) permitidas.add(`https://${env.VERCEL_BRANCH_URL}`);
  return permitidas.has(origem.replace(/\/$/, ''));
}
function emailValido(email) { return !email || (email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)); }

export function createFeedbackHandler({ env = process.env, fetchImpl = fetch, rateLimit = aplicarRateLimit } = {}) {
  return async function feedbackHandler(req, res) {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return responder(res, 405, { ok: false, error: 'Método não permitido.' }); }
    if (!origemPermitida(req, env)) return responder(res, 403, { ok: false, error: 'Origem não permitida.' });
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? '')) return responder(res, 415, { ok: false, error: 'Envie os dados em JSON.' });
    if (!env.RESEND_API_KEY) { console.warn('[Feedback] RESEND_API_KEY não configurada.'); return responder(res, 503, { ok: false, error: 'Serviço de e-mail indisponível.' }); }
    try {
      await rateLimit({ req, env, scope: 'feedback', limit: 5, windowSeconds: 900 });
      const body = await lerBody(req);
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('DADOS_INVALIDOS');
      const tipo = typeof body.tipo === 'string' ? body.tipo.trim() : '';
      const mensagem = typeof body.mensagem === 'string' ? body.mensagem.trim() : '';
      const emailUsuario = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const navegador = typeof body.navegador === 'string' ? body.navegador.trim() : '';
      const website = typeof body.website === 'string' ? body.website.trim() : '';
      if (website) return responder(res, 200, { ok: true });
      if (!TIPOS.has(tipo) || !mensagem || mensagem.length > 5000 || !emailValido(emailUsuario) || navegador.length > 500 || (tipo !== 'Bug' && navegador))
        return responder(res, 400, { ok: false, error: 'Dados inválidos.' });
      const texto = [`Tipo: ${tipo}`, emailUsuario ? `E-mail do usuário: ${emailUsuario}` : null, tipo === 'Bug' && navegador ? `Navegador: ${navegador}` : null, `Data: ${new Date().toISOString()}`, '', 'Mensagem:', mensagem].filter((linha) => linha !== null).join('\n');
      const resposta = await fetchImpl('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: REMETENTE_TESTE, to: [DESTINATARIO_PADRAO], subject: `[Liste & Compre] ${tipo}`, text: texto }) });
      const resultado = await resposta.json().catch(() => ({}));
      if (!resposta.ok) { console.warn('[Feedback] Resend recusou o envio:', resposta.status, resultado?.name ?? 'erro'); return responder(res, 502, { ok: false, error: 'Não foi possível enviar a mensagem agora.', code: resultado?.name ?? 'RESEND_ERROR' }); }
      return responder(res, 200, { ok: true, id: resultado?.id ?? null });
    } catch (error) {
      if (error?.status === 429) { if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter)); return responder(res, 429, { ok: false, error: error.message }); }
      const corpoGrande = error instanceof Error && error.message === 'CORPO_GRANDE';
      return responder(res, corpoGrande ? 413 : 400, { ok: false, error: corpoGrande ? 'Mensagem muito grande.' : 'Dados inválidos.' });
    }
  };
}
export default createFeedbackHandler();
