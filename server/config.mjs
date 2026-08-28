import { AppError } from './errors.mjs';
export const requiredVariables = [
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'AUTH_VERIFICATION_SECRET',
  'APP_ORIGIN',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_PRIVATE_KEY',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_CADASTRO_ID',
  'EMAILJS_TEMPLATE_RECUPERACAO_ID',
];
export function configProblems(env) {
  const problems = requiredVariables.filter(
    (key) =>
      !env[key]?.trim() ||
      /COLE_|PREENCHA_|sua_chave|seu_projeto/i.test(env[key]),
  );
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(env.SUPABASE_URL ?? ''))
    problems.push('SUPABASE_URL');
  if (env.SUPABASE_SECRET_KEY?.startsWith('sb_publishable_'))
    problems.push('SUPABASE_SECRET_KEY');
  if ((env.AUTH_VERIFICATION_SECRET ?? '').trim().length < 43)
    problems.push('AUTH_VERIFICATION_SECRET');
  try {
    const origin = new URL(env.APP_ORIGIN);
    if (
      origin.origin !== env.APP_ORIGIN ||
      (origin.protocol !== 'https:' &&
        !['http://127.0.0.1:5173', 'http://localhost:5173'].includes(
          origin.origin,
        ))
    )
      problems.push('APP_ORIGIN');
  } catch {
    problems.push('APP_ORIGIN');
  }
  return [...new Set(problems)];
}
export function getConfig(env = process.env) {
  if (configProblems(env).length) {
    throw new AppError(
      503,
      'CONFIGURACAO',
      'A autenticação ainda não foi configurada. Consulte o guia de instalação.',
    );
  }
  return Object.fromEntries(
    requiredVariables.map((key) => [key, env[key].trim()]),
  );
}
