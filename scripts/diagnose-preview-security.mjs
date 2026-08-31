import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const env = process.env;
const vars = [
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'AUTH_VERIFICATION_SECRET',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_PRIVATE_KEY',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_CADASTRO_ID',
  'EMAILJS_TEMPLATE_RECUPERACAO_ID',
];

console.log('[diag-preview] presença de variáveis:');
for (const key of vars) {
  console.log(`[diag-preview] ${key}: ${env[key]?.trim() ? 'presente' : 'ausente'}`);
}

const url = env.SUPABASE_URL?.trim() ?? '';
const secretKey = env.SUPABASE_SECRET_KEY?.trim() ?? '';
const verificationSecret = env.AUTH_VERIFICATION_SECRET?.trim() ?? '';

console.log(
  `[diag-preview] SUPABASE_URL formato: ${/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) ? 'válido' : 'inválido/ausente'}`,
);
console.log(
  `[diag-preview] SUPABASE_SECRET_KEY tipo: ${secretKey.startsWith('sb_publishable_') ? 'publishable-inválida' : secretKey ? 'servidor/não-publicável' : 'ausente'}`,
);
console.log(
  `[diag-preview] AUTH_VERIFICATION_SECRET comprimento mínimo: ${verificationSecret.length >= 43 ? 'válido' : 'inválido/ausente'}`,
);

if (url && secretKey && verificationSecret) {
  const client = createClient(url.replace(/\/$/, ''), secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const sourceKey = createHmac('sha256', verificationSecret)
    .update('preview-build-diagnostic')
    .digest('hex');
  const { data, error } = await client.rpc('lc_rate_limit', {
    p_scope: 'diagnostic-preview',
    p_source_key: sourceKey,
    p_limit: 100,
    p_window_seconds: 60,
  });

  if (error) {
    console.log(
      `[diag-preview] lc_rate_limit: erro code=${error.code ?? 'sem-code'} message=${error.message ?? 'sem-message'}`,
    );
  } else {
    console.log(
      `[diag-preview] lc_rate_limit: ${data?.allowed === true ? 'ok' : 'resposta-inválida'}`,
    );
  }
} else {
  console.log('[diag-preview] lc_rate_limit: não testado por configuração ausente');
}
