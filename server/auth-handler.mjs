import { AppError } from './errors.mjs';
import { getConfig } from './config.mjs';
import { createProviders } from './providers.mjs';
import { createAuthController } from './auth-controller.mjs';
import { aplicarRateLimit } from './rate-limit.mjs';

export async function readBody(req) {
  if (Number(req.headers['content-length'] ?? 0) > 8192)
    throw new AppError(413, 'CORPO_GRANDE', 'Solicitação muito grande.');
  let raw = req.body;
  if (raw === undefined) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > 8192) throw new AppError(413, 'CORPO_GRANDE', 'Solicitação muito grande.');
      chunks.push(Buffer.from(chunk));
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.byteLength(typeof raw === 'string' ? raw : JSON.stringify(raw)) > 8192)
    throw new AppError(413, 'CORPO_GRANDE', 'Solicitação muito grande.');
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { throw new AppError(400, 'JSON_INVALIDO', 'Solicitação inválida.'); }
}
export function createHandler({ env = process.env, controller, rateLimit = aplicarRateLimit } = {}) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); throw new AppError(405, 'METODO_INVALIDO', 'Método não permitido.'); }
      const allowed = new Set([env.APP_ORIGIN]);
      if (env.VERCEL_ENV === 'preview' && env.VERCEL_URL) allowed.add(`https://${env.VERCEL_URL}`);
      if (typeof req.headers.origin !== 'string' || !allowed.has(req.headers.origin))
        throw new AppError(403, 'ORIGEM_INVALIDA', 'Origem não permitida.');
      if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? ''))
        throw new AppError(415, 'TIPO_INVALIDO', 'Envie JSON.');
      const body = await readBody(req);
      if (body?.action === 'start') {
        await rateLimit({ req, env, scope: 'auth-start', limit: 15, windowSeconds: 900 });
      }
      const config = controller ? null : getConfig(env);
      const handle = controller ?? createAuthController({ secret: config.AUTH_VERIFICATION_SECRET, providers: createProviders(config) });
      const result = await handle(body);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (error) {
      const known = error instanceof AppError;
      res.statusCode = known ? error.status : 503;
      if (known && error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
      if (!known) console.warn('[Auth] Falha interna (detalhes sensíveis omitidos).');
      res.end(JSON.stringify({ ok: false, code: known ? error.code : 'INDISPONIVEL', error: known ? error.message : 'Serviço indisponível. Confira a conexão e tente novamente.' }));
    }
  };
}
export default createHandler();
