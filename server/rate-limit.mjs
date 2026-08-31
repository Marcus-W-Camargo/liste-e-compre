import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { AppError } from './errors.mjs';

function origemDaRequisicao(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded ?? '').split(',')[0];
  return ip.trim() || String(req.headers['x-real-ip'] ?? '').trim() || 'unknown';
}

export async function aplicarRateLimit({
  req,
  env,
  scope,
  limit,
  windowSeconds,
}) {
  const secret = env.AUTH_VERIFICATION_SECRET;
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY;
  if (!secret || !url || !key)
    throw new AppError(
      503,
      'CONFIGURACAO',
      'Serviço temporariamente indisponível.',
    );

  const sourceKey = createHmac('sha256', secret)
    .update(`rate-limit:${scope}:${origemDaRequisicao(req)}`)
    .digest('hex');
  const client = createClient(url.replace(/\/$/, ''), key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await client.rpc('lc_rate_limit', {
    p_scope: scope,
    p_source_key: sourceKey,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error || !data)
    throw new AppError(
      503,
      'RATE_LIMIT_INDISPONIVEL',
      'Serviço temporariamente indisponível.',
    );

  if (data.allowed !== true) {
    throw new AppError(
      429,
      'MUITAS_REQUISICOES',
      'Muitas solicitações. Aguarde alguns minutos e tente novamente.',
      Number(data.retryAfter) || windowSeconds,
    );
  }
}
