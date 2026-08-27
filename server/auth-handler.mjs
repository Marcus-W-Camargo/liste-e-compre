import { isIP } from 'node:net';
import { normalizarEmail, emailValido, nomeValido, senhaValida, ERRO_NOME } from '../shared/auth-validation.mjs';
import { AuthError, verificationError } from './errors.mjs';

const ACTIONS = new Set(['start', 'confirm-signup', 'verify-recovery', 'reset-password']);

export function createAuthHandler({ env, getVerification, getAccounts }) {
  const secure = env.VERCEL === '1' || env.NODE_ENV === 'production';
  const cookieName = secure ? '__Host-lc-verification' : 'lc-verification';
  const cookie = (value, seconds) => `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secure ? '; Secure' : ''}`;

  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    try {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        throw new AuthError(405, 'Método não permitido.');
      }
      const origins = new Set([env.APP_ORIGIN]);
      if (env.VERCEL_URL) origins.add(`https://${env.VERCEL_URL}`);
      if (!origins.has(req.headers.origin) || !req.headers.origin) {
        throw new AuthError(403, 'Origem não permitida.');
      }
      if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
        throw new AuthError(415, 'Envie os dados em JSON.');
      }
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
      if (Buffer.byteLength(raw) > 8192) throw new AuthError(413, 'Dados excedem o tamanho permitido.');
      let data;
      try { data = JSON.parse(raw); } catch { throw new AuthError(400, 'Dados inválidos.'); }
      if (!data || Array.isArray(data) || typeof data !== 'object' || !ACTIONS.has(data.action)) {
        throw new AuthError(400, 'Operação inválida.');
      }
      const email = normalizarEmail(data.email);
      if (!emailValido(email)) throw new AuthError(400, 'Informe um e-mail válido.');
      // Vercel define este cabeçalho. Fora dela, não confiamos em forwarded headers do cliente.
      const ip = env.VERCEL === '1'
        ? String(req.headers['x-vercel-forwarded-for'] || '').split(',')[0].trim()
        : req.socket?.remoteAddress;
      if (!ip || !isIP(ip)) throw new AuthError(503, 'Não foi possível validar a solicitação.');
      const nonce = String(req.headers.cookie || '').split(';').map((part) => part.trim())
        .find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || '';
      const verification = getVerification();

      if (data.action === 'start') {
        if (data.type !== 'cadastro' && data.type !== 'recuperacao') throw new AuthError(400, 'Operação inválida.');
        if (data.type === 'cadastro' && !nomeValido(data.nome)) throw new AuthError(400, ERRO_NOME);
        if (Object.hasOwn(data, 'senha') || Object.hasOwn(data, 'password')) {
          throw new AuthError(400, 'Não envie a senha antes da confirmação.');
        }
        const token = await verification.start(data.type, email,
          data.type === 'cadastro' ? data.nome.normalize('NFC') : 'Usuário', ip);
        res.setHeader('Set-Cookie', cookie(token, 600));
      } else {
        if (!/^[A-Za-z0-9_-]{43}$/.test(nonce)) throw verificationError();
        if (data.action !== 'reset-password' && !/^\d{4}$/.test(data.codigo ?? '')) {
          throw new AuthError(400, 'Informe o código de 4 dígitos.');
        }
        if (data.action === 'confirm-signup' || data.action === 'reset-password') {
          if (!senhaValida(data.senha)) throw new AuthError(400,
            'A senha precisa de 6 caracteres, letra, número e símbolo, e no máximo 72 bytes.');
        }
        if (data.action === 'confirm-signup') {
          if (!nomeValido(data.nome)) throw new AuthError(400, ERRO_NOME);
          await verification.verify('cadastro', email, nonce, data.codigo, ip);
          res.setHeader('Set-Cookie', cookie('', 0));
          // Não instanciar/chamar Supabase em nenhuma etapa anterior.
          await getAccounts().signup(email, data.senha, data.nome.normalize('NFC'));
        } else if (data.action === 'verify-recovery') {
          const resetToken = await verification.verify('recuperacao', email, nonce, data.codigo, ip);
          res.setHeader('Set-Cookie', cookie(resetToken, 300));
        } else {
          await verification.consumeReset(email, nonce, ip);
          res.setHeader('Set-Cookie', cookie('', 0));
          await getAccounts().reset(email, data.senha);
        }
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      const known = error instanceof AuthError;
      res.statusCode = known ? error.status : 503;
      if (known && error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      // Não registrar corpo, código, senha, cookies ou erros brutos dos provedores.
      res.end(JSON.stringify({ error: known ? error.message : 'Serviço temporariamente indisponível. Tente novamente mais tarde.' }));
    }
  };
}
