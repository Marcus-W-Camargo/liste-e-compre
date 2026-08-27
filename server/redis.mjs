import { AuthError } from './errors.mjs';

export function createRedis(env, request = fetch) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url?.startsWith('https://') || !token) {
    throw new AuthError(503, 'A autenticação ainda não foi configurada no servidor.');
  }
  return async function command(...args) {
    try {
      const response = await request(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(8000),
      });
      const data = await response.json();
      if (!response.ok || data.error || !Object.hasOwn(data, 'result')) throw new Error('Redis unavailable');
      return data.result;
    } catch {
      // Nunca liberar uma operação quando o controle de tentativas falhar.
      throw new AuthError(503, 'Verificação temporariamente indisponível. Tente novamente mais tarde.');
    }
  };
}
