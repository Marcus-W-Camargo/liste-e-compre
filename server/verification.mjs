import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { AuthError, verificationError } from './errors.mjs';

// Todas as decisões de limite e consumo são atômicas, inclusive entre instâncias Vercel.
export const LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
if count > tonumber(ARGV[1]) then return math.max(1, redis.call('TTL', KEYS[1])) end
return 0`;

export const ISSUE_SCRIPT = `
redis.call('DEL', KEYS[1])
redis.call('HSET', KEYS[1], 'nonce', ARGV[1], 'code', ARGV[2], 'state', 'sending', 'attempts', 0)
redis.call('EXPIRE', KEYS[1], 600)
return 1`;

export const READY_SCRIPT = `
if redis.call('HGET', KEYS[1], 'nonce') ~= ARGV[1] then return 0 end
redis.call('HSET', KEYS[1], 'state', 'ready')
return 1`;

export const CANCEL_SCRIPT = `
if redis.call('HGET', KEYS[1], 'nonce') ~= ARGV[1] then return 0 end
return redis.call('DEL', KEYS[1])`;

export const VERIFY_SCRIPT = `
if redis.call('HGET', KEYS[1], 'nonce') ~= ARGV[1] then return 0 end
if redis.call('HGET', KEYS[1], 'state') ~= 'ready' then return 0 end
local attempts = redis.call('HINCRBY', KEYS[1], 'attempts', 1)
if attempts > 5 then redis.call('DEL', KEYS[1]); return 0 end
if redis.call('HGET', KEYS[1], 'code') ~= ARGV[2] then
  if attempts == 5 then redis.call('DEL', KEYS[1]) end
  return 0
end
if ARGV[3] == '' then
  redis.call('DEL', KEYS[1])
else
  redis.call('HDEL', KEYS[1], 'code')
  redis.call('HSET', KEYS[1], 'state', 'verified', 'nonce', ARGV[3])
  redis.call('EXPIRE', KEYS[1], 300)
end
return 1`;

export const RESET_SCRIPT = `
if redis.call('HGET', KEYS[1], 'nonce') ~= ARGV[1] then return 0 end
if redis.call('HGET', KEYS[1], 'state') ~= 'verified' then return 0 end
redis.call('DEL', KEYS[1])
return 1`;

export function createVerification({ command, secret, namespace, sendEmail, dailyLimit = 100 }) {
  if (!secret || Buffer.from(secret, 'base64url').length < 32 || !namespace) {
    throw new AuthError(503, 'A autenticação ainda não foi configurada no servidor.');
  }
  const prefix = `lc:auth:${namespace}:`;
  const digest = (...parts) => createHmac('sha256', secret).update(JSON.stringify(parts)).digest('hex');
  const key = (type, email) => `${prefix}challenge:${digest(type, email)}`;
  const nonceHash = (nonce) => digest('nonce', nonce);
  const evalOne = (script, redisKey, ...args) => command('EVAL', script, 1, redisKey, ...args);

  async function limit(label, identifier, maximum, seconds) {
    const wait = await evalOne(LIMIT_SCRIPT,
      `${prefix}limit:${label}:${digest(identifier)}`, maximum, seconds);
    if (!Number.isInteger(wait) || wait < 0) throw new AuthError(503, 'Verificação indisponível.');
    if (wait > 0) throw new AuthError(429, 'Limite de tentativas atingido. Aguarde para tentar novamente.', wait);
  }

  async function start(type, email, name, ip) {
    await limit('send-ip', ip, 10, 3600);
    // Compartilhado entre cadastro e recuperação: mudar o fluxo não reinicia limites.
    await limit('send-cooldown', email, 1, 60);
    await limit('send-email', email, 3, 3600);
    await limit('send-global', 'all', 1, 1); // limite do EmailJS
    await limit('send-daily', 'all', dailyLimit, 86400);
    const nonce = randomBytes(32).toString('base64url');
    const code = randomInt(0, 10000).toString().padStart(4, '0');
    const redisKey = key(type, email);
    await evalOne(ISSUE_SCRIPT, redisKey, nonceHash(nonce), digest(type, email, nonce, code));
    try {
      // O código puro existe somente na memória do servidor e no e-mail enviado.
      await sendEmail({ type, email, name, code });
      if (await evalOne(READY_SCRIPT, redisKey, nonceHash(nonce)) !== 1) throw verificationError();
    } catch (error) {
      await evalOne(CANCEL_SCRIPT, redisKey, nonceHash(nonce));
      throw error;
    }
    return nonce;
  }

  async function verify(type, email, nonce, code, ip) {
    await limit('verify-ip', ip, 30, 600);
    await limit('verify-email', email, 5, 600);
    await limit('verify-email-daily', email, 10, 86400);
    const resetNonce = type === 'recuperacao' ? randomBytes(32).toString('base64url') : '';
    const ok = await evalOne(VERIFY_SCRIPT, key(type, email), nonceHash(nonce),
      digest(type, email, nonce, code), resetNonce ? nonceHash(resetNonce) : '');
    if (ok !== 1) throw verificationError();
    return resetNonce;
  }

  async function consumeReset(email, nonce, ip) {
    await limit('reset-ip', ip, 10, 600);
    if (await evalOne(RESET_SCRIPT, key('recuperacao', email), nonceHash(nonce)) !== 1) {
      throw verificationError();
    }
  }

  return { start, verify, consumeReset };
}
