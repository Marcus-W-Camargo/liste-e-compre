import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { aplicarRateLimit } from './rate-limit.mjs';

const ORIGEM_PRODUCAO = 'https://listeecompre.vercel.app';
const REMETENTE_PADRAO = 'Liste & Compre <onboarding@resend.dev>';
const VALIDADE_TOKEN_MS = 30 * 60 * 1000;

function responder(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

function normalizarOrigem(valor) {
  return typeof valor === 'string' ? valor.replace(/\/$/, '') : '';
}

function origemPermitida(req, env) {
  const origem = normalizarOrigem(req.headers.origin);
  if (!origem) return false;

  const permitidas = new Set([ORIGEM_PRODUCAO]);
  if (env.APP_ORIGIN) permitidas.add(normalizarOrigem(env.APP_ORIGIN));
  if (env.VERCEL_URL) permitidas.add(`https://${env.VERCEL_URL}`);
  if (env.VERCEL_BRANCH_URL)
    permitidas.add(`https://${env.VERCEL_BRANCH_URL}`);

  return permitidas.has(origem);
}

function origemDaRequisicao(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded ?? '').split(',')[0];
  return ip.trim() || String(req.headers['x-real-ip'] ?? '').trim() || 'unknown';
}

function assinatura(secret, valor) {
  return createHmac('sha256', secret).update(valor).digest('base64url');
}

function hashVinculo(secret, tipo, valor) {
  return createHmac('sha256', secret)
    .update(`account-delete:${tipo}:${valor}`)
    .digest('hex');
}

function criarToken(secret, payload) {
  const corpo = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${corpo}.${assinatura(secret, corpo)}`;
}

function lerToken(secret, token) {
  if (typeof token !== 'string') return null;
  const [corpo, recebida, extra] = token.split('.');
  if (!corpo || !recebida || extra) return null;

  const esperada = assinatura(secret, corpo);
  const a = Buffer.from(recebida);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    if (!Number.isFinite(payload.exp) || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

async function lerBody(req) {
  if (req.body !== undefined) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }

  const chunks = [];
  let tamanho = 0;
  for await (const chunk of req) {
    tamanho += Buffer.byteLength(chunk);
    if (tamanho > 8_000) throw new Error('CORPO_GRANDE');
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function criarClient(env, createClientImpl) {
  return createClientImpl(
    env.SUPABASE_URL.replace(/\/$/, ''),
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

async function usuarioAutenticado(client, authorization) {
  if (!authorization.startsWith('Bearer ')) return null;
  const token = authorization.slice(7);
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);
  return error ? null : user;
}

async function removerConta(client, userId) {
  const path = `${userId}/avatar.jpg`;
  const { error: storageError } = await client.storage
    .from('profile-photos')
    .remove([path]);
  if (
    storageError &&
    !/not found|object not found/i.test(storageError.message ?? '')
  ) {
    throw new Error('STORAGE');
  }

  const { error: deleteError } = await client.auth.admin.deleteUser(userId);
  if (deleteError) throw new Error('DELETE');
}

export function createDeleteAccountHandler({
  env = process.env,
  createClientImpl = createClient,
  fetchImpl = fetch,
  rateLimit = aplicarRateLimit,
} = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return responder(res, 405, { ok: false, error: 'Método não permitido.' });
    }

    if (!origemPermitida(req, env))
      return responder(res, 403, { ok: false, error: 'Origem não permitida.' });

    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? ''))
      return responder(res, 415, { ok: false, error: 'Envie os dados em JSON.' });

    if (
      !env.SUPABASE_URL ||
      !env.SUPABASE_SECRET_KEY ||
      !env.AUTH_VERIFICATION_SECRET
    ) {
      return responder(res, 503, {
        ok: false,
        error: 'Serviço temporariamente indisponível.',
      });
    }

    let body;
    try {
      body = await lerBody(req);
    } catch {
      return responder(res, 400, { ok: false, error: 'Dados inválidos.' });
    }

    const action = typeof body?.action === 'string' ? body.action : '';
    const deviceId = typeof body?.deviceId === 'string' ? body.deviceId.trim() : '';
    if (!deviceId || deviceId.length < 24 || deviceId.length > 160)
      return responder(res, 400, { ok: false, error: 'Dispositivo inválido.' });

    const authorization = String(req.headers.authorization ?? '');
    const client = criarClient(env, createClientImpl);
    const user = await usuarioAutenticado(client, authorization);
    if (!user)
      return responder(res, 401, {
        ok: false,
        error: 'Sessão inválida. Entre novamente.',
      });

    if (action === 'request') {
      if (!env.RESEND_API_KEY || !user.email)
        return responder(res, 503, {
          ok: false,
          error: 'Serviço de e-mail indisponível.',
        });

      try {
        await rateLimit({
          req,
          env,
          scope: 'account-delete-request',
          limit: 3,
          windowSeconds: 900,
        });
      } catch (error) {
        const status = Number(error?.status) || 503;
        if (error?.retryAfter)
          res.setHeader('Retry-After', String(error.retryAfter));
        return responder(res, status, {
          ok: false,
          error:
            status === 429
              ? 'Muitas solicitações. Aguarde alguns minutos e tente novamente.'
              : 'Serviço temporariamente indisponível.',
        });
      }

      const secret = env.AUTH_VERIFICATION_SECRET;
      const token = criarToken(secret, {
        uid: user.id,
        email: String(user.email).toLowerCase(),
        ip: hashVinculo(secret, 'ip', origemDaRequisicao(req)),
        device: hashVinculo(secret, 'device', deviceId),
        exp: Date.now() + VALIDADE_TOKEN_MS,
      });

      const origem = normalizarOrigem(req.headers.origin) || ORIGEM_PRODUCAO;
      const link = `${origem}/confirmar-exclusao?token=${encodeURIComponent(token)}`;
      const respostaEmail = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.RESEND_FROM_EMAIL || REMETENTE_PADRAO,
          to: [user.email],
          subject: '[Liste & Compre] Confirme a exclusão da sua conta',
          text: [
            'Você solicitou a exclusão da sua conta no Liste & Compre.',
            '',
            'Abra o link abaixo no mesmo dispositivo e na mesma conexão usados na solicitação:',
            link,
            '',
            'Se você não solicitou a exclusão, ignore esta mensagem.',
          ].join('\n'),
        }),
      });

      if (!respostaEmail.ok)
        return responder(res, 502, {
          ok: false,
          error: 'Não foi possível enviar o e-mail de confirmação agora.',
        });

      return responder(res, 200, { ok: true });
    }

    if (action === 'confirm') {
      const payload = lerToken(env.AUTH_VERIFICATION_SECRET, body?.token);
      const emailAtual = String(user.email ?? '').toLowerCase();
      const mesmoUsuario = payload?.uid === user.id && payload?.email === emailAtual;
      const mesmoIp =
        payload?.ip ===
        hashVinculo(
          env.AUTH_VERIFICATION_SECRET,
          'ip',
          origemDaRequisicao(req),
        );
      const mesmoDispositivo =
        payload?.device ===
        hashVinculo(env.AUTH_VERIFICATION_SECRET, 'device', deviceId);

      if (!payload || !mesmoUsuario || !mesmoIp || !mesmoDispositivo)
        return responder(res, 403, {
          ok: false,
          error:
            'A deletação de conta não foi bem-sucedida. Por favor entre no link com o mesmo dispositivo usado na solicitação.',
        });

      try {
        await removerConta(client, user.id);
      } catch {
        return responder(res, 503, {
          ok: false,
          error: 'Não foi possível excluir a conta agora. Tente novamente.',
        });
      }

      return responder(res, 200, { ok: true });
    }

    return responder(res, 400, { ok: false, error: 'Ação inválida.' });
  };
}

export default createDeleteAccountHandler();
