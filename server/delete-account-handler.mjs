import { createHmac, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { aplicarRateLimit } from './rate-limit.mjs';
import { createProviders } from './providers.mjs';

const ORIGEM_PRODUCAO = 'https://listeecompre.vercel.app';
const PURPOSE = 'exclusao';

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

function configuracaoValida(env) {
  return [
    'SUPABASE_URL',
    'SUPABASE_SECRET_KEY',
    'AUTH_VERIFICATION_SECRET',
    'EMAILJS_PUBLIC_KEY',
    'EMAILJS_PRIVATE_KEY',
    'EMAILJS_SERVICE_ID',
    'EMAILJS_TEMPLATE_CADASTRO_ID',
    'EMAILJS_TEMPLATE_RECUPERACAO_ID',
  ].every((chave) => typeof env[chave] === 'string' && env[chave].trim());
}

function emailConfig(env) {
  return {
    SUPABASE_URL: env.SUPABASE_URL.trim(),
    SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY.trim(),
    EMAILJS_PUBLIC_KEY: env.EMAILJS_PUBLIC_KEY.trim(),
    EMAILJS_PRIVATE_KEY: env.EMAILJS_PRIVATE_KEY.trim(),
    EMAILJS_SERVICE_ID: env.EMAILJS_SERVICE_ID.trim(),
    EMAILJS_TEMPLATE_CADASTRO_ID: env.EMAILJS_TEMPLATE_CADASTRO_ID.trim(),
    EMAILJS_TEMPLATE_RECUPERACAO_ID: env.EMAILJS_TEMPLATE_RECUPERACAO_ID.trim(),
  };
}

function mac(secret, ...parts) {
  return createHmac('sha256', secret)
    .update(JSON.stringify(parts))
    .digest('hex');
}

function tentativaValida(body) {
  return (
    /^[a-f0-9-]{36}$/.test(body?.id ?? '') &&
    /^[a-f0-9]{64}$/.test(body?.token ?? '') &&
    /^[a-f0-9]{64}$/.test(body?.sessionId ?? '')
  );
}

function mapearVerificacao(result) {
  if (result?.ok === true) return null;
  if (result?.reason === 'locked')
    return 'Cinco códigos incorretos. Inicie uma nova solicitação.';
  if (result?.reason === 'wrong_code')
    return `Código incorreto. Restam ${result.remaining} tentativa(s).`;
  return 'Esta solicitação não está mais disponível. Inicie novamente.';
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
  providersFactory = createProviders,
  generateCode = () => String(randomInt(10000)).padStart(4, '0'),
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

    if (!configuracaoValida(env))
      return responder(res, 503, {
        ok: false,
        error: 'Serviço temporariamente indisponível.',
      });

    let body;
    try {
      body = await lerBody(req);
    } catch {
      return responder(res, 400, { ok: false, error: 'Dados inválidos.' });
    }

    const authorization = String(req.headers.authorization ?? '');
    const client = criarClient(env, createClientImpl);
    const user = await usuarioAutenticado(client, authorization);
    if (!user?.email)
      return responder(res, 401, {
        ok: false,
        error: 'Sessão inválida. Entre novamente.',
      });

    const secret = env.AUTH_VERIFICATION_SECRET;
    const email = String(user.email).trim().toLowerCase();
    const emailKey = mac(secret, 'email', email);
    const providers = providersFactory(emailConfig(env), fetchImpl);
    const action = typeof body?.action === 'string' ? body.action : '';

    if (action === 'request') {
      if (!/^[a-f0-9]{64}$/.test(body?.sessionId ?? ''))
        return responder(res, 400, { ok: false, error: 'Sessão inválida.' });

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

      const id = randomUUID();
      const token = randomBytes(32).toString('hex');
      const binding = {
        p_id: id,
        p_token_mac: mac(secret, 'delete-token', token, body.sessionId),
      };

      let code = '';
      let result;
      for (let n = 0; n < 20; n += 1) {
        code = generateCode();
        result = await providers.rpc('lc_auth_start', {
          ...binding,
          p_email_key: emailKey,
          p_purpose: PURPOSE,
          p_code_mac: mac(secret, 'code', id, emailKey, PURPOSE, code),
          p_fingerprint: mac(secret, 'last', emailKey, code),
        });
        if (result?.reason !== 'repeat') break;
      }

      if (result?.reason === 'rate_limit')
        return responder(res, 429, {
          ok: false,
          error: 'Muitas solicitações. Aguarde antes de pedir outro código.',
          retryAfter: Number(result.retryAfter) || undefined,
        });

      if (result?.ok !== true)
        return responder(res, 503, {
          ok: false,
          error: 'Não foi possível iniciar a confirmação. Tente novamente.',
        });

      try {
        await providers.send({
          purpose: PURPOSE,
          email,
          name: user.user_metadata?.full_name || 'Usuário',
          code,
        });
        if ((await providers.rpc('lc_auth_activate', binding)) !== true)
          throw new Error('ATIVACAO');
      } catch {
        await providers.rpc('lc_auth_cancel', binding).catch(() => {});
        return responder(res, 503, {
          ok: false,
          error: 'Não foi possível enviar o código. Tente novamente.',
        });
      }

      return responder(res, 200, { ok: true, id, token });
    }

    if (action === 'cancel') {
      if (!tentativaValida(body))
        return responder(res, 400, { ok: false, error: 'Dados inválidos.' });
      await providers
        .rpc('lc_auth_cancel', {
          p_id: body.id,
          p_token_mac: mac(secret, 'delete-token', body.token, body.sessionId),
        })
        .catch(() => {});
      return responder(res, 200, { ok: true });
    }

    if (action === 'confirm') {
      if (!tentativaValida(body) || !/^\d{4}$/.test(body?.code ?? ''))
        return responder(res, 400, {
          ok: false,
          error: 'Informe o código de 4 dígitos.',
        });

      const result = await providers.rpc('lc_auth_verify', {
        p_id: body.id,
        p_email_key: emailKey,
        p_purpose: PURPOSE,
        p_token_mac: mac(secret, 'delete-token', body.token, body.sessionId),
        p_code_mac: mac(secret, 'code', body.id, emailKey, PURPOSE, body.code),
        p_reset_mac: null,
      });
      const erroVerificacao = mapearVerificacao(result);
      if (erroVerificacao)
        return responder(res, 400, { ok: false, error: erroVerificacao });

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
