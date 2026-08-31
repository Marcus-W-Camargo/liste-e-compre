import { AppError } from './errors.mjs';
import { getConfig } from './config.mjs';
import { createProviders } from './providers.mjs';
import { createAuthController } from './auth-controller.mjs';
import { aplicarRateLimit } from './rate-limit.mjs';

const ORIGEM_PRODUCAO = 'https://listeecompre.vercel.app';

function normalizarOrigem(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return null;

  try {
    const url = new URL(valor.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

function origemVercelPreview(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return null;

  const origem = normalizarOrigem(`https://${valor.trim().replace(/^https?:\/\//i, '')}`);
  if (!origem) return null;

  try {
    const { hostname, protocol } = new URL(origem);
    if (protocol !== 'https:' || !hostname.endsWith('.vercel.app')) return null;
    return origem;
  } catch {
    return null;
  }
}

function origensPermitidas(env) {
  const allowed = new Set([ORIGEM_PRODUCAO]);
  const appOrigin = normalizarOrigem(env.APP_ORIGIN);
  if (appOrigin) allowed.add(appOrigin);

  if (env.VERCEL_ENV === 'preview') {
    for (const valor of [env.VERCEL_URL, env.VERCEL_BRANCH_URL]) {
      const origem = origemVercelPreview(valor);
      if (origem) allowed.add(origem);
    }
  }

  return allowed;
}

export async function readBody(req) {
  if (Number(req.headers['content-length'] ?? 0) > 8192)
    throw new AppError(413, 'CORPO_GRANDE', 'Solicitação muito grande.');
  let raw = req.body;
  if (raw === undefined) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > 8192)
        throw new AppError(413, 'CORPO_GRANDE', 'Solicitação muito grande.');
      chunks.push(Buffer.from(chunk));
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (
    Buffer.byteLength(typeof raw === 'string' ? raw : JSON.stringify(raw)) >
    8192
  )
    throw new AppError(413, 'CORPO_GRANDE', 'Solicitação muito grande.');
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    throw new AppError(400, 'JSON_INVALIDO', 'Solicitação inválida.');
  }
}

export function createHandler({
  env = process.env,
  controller,
  rateLimit,
} = {}) {
  const limiter = rateLimit ?? (controller ? async () => {} : aplicarRateLimit);

  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    let body;

    try {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        throw new AppError(405, 'METODO_INVALIDO', 'Método não permitido.');
      }
      const origem = normalizarOrigem(req.headers.origin);
      if (!origem || !origensPermitidas(env).has(origem))
        throw new AppError(403, 'ORIGEM_INVALIDA', 'Origem não permitida.');
      if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? ''))
        throw new AppError(415, 'TIPO_INVALIDO', 'Envie JSON.');

      body = await readBody(req);
      if (body?.action === 'start') {
        await limiter({
          req,
          env,
          scope: 'auth-start',
          limit: 15,
          windowSeconds: 900,
        });
      }

      const config = controller ? null : getConfig(env);
      const handle =
        controller ??
        createAuthController({
          secret: config.AUTH_VERIFICATION_SECRET,
          providers: createProviders(config),
        });
      const result = await handle(body);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (error) {
      const known = error instanceof AppError;
      const neutralVerificationError =
        known &&
        ['confirm-signup', 'verify-recovery'].includes(body?.action) &&
        [
          'CODIGO_INCORRETO',
          'TENTATIVA_INVALIDA',
          'TENTATIVA_BLOQUEADA',
        ].includes(error.code);
      const publicError = neutralVerificationError
        ? new AppError(
            400,
            'VERIFICACAO_INVALIDA',
            'Não foi possível confirmar o código. Confira os dados ou inicie uma nova tentativa.',
          )
        : error;
      const publicKnown = publicError instanceof AppError;

      res.statusCode = publicKnown ? publicError.status : 503;
      if (publicKnown && publicError.retryAfter)
        res.setHeader('Retry-After', String(publicError.retryAfter));
      if (!known)
        console.warn('[Auth] Falha interna (detalhes sensíveis omitidos).');
      res.end(
        JSON.stringify({
          ok: false,
          code: publicKnown ? publicError.code : 'INDISPONIVEL',
          error: publicKnown
            ? publicError.message
            : 'Serviço indisponível. Confira a conexão e tente novamente.',
        }),
      );
    }
  };
}

export default createHandler();
