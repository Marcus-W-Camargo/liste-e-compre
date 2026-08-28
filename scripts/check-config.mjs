import { configProblems, getConfig } from '../server/config.mjs';
import { createProviders } from '../server/providers.mjs';
import { AppError } from '../server/errors.mjs';
const problems = configProblems(process.env);
for (const key of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']) {
  if (!process.env[key] || /COLE_|PREENCHA_/.test(process.env[key]))
    problems.push(key);
}
if (process.env.VITE_SUPABASE_URL !== process.env.SUPABASE_URL)
  problems.push('URLs do Supabase diferentes');
if (problems.length) {
  console.error(
    'Revise estas configurações (valores não exibidos):',
    problems.join(', '),
  );
  process.exitCode = 1;
} else {
  try {
    const providers = createProviders(getConfig());
    await providers.assertReady();
    // Verifica instalação/permissões/retorno da RPC sem consultar um usuário real.
    if (
      (await providers.rpc('lc_auth_email_exists', { p_email: null })) !== false
    )
      throw new AppError(
        503,
        'CONSULTA_EMAIL_FALHOU',
        'A consulta de e-mail retornou um resultado inesperado. Confira supabase/04-email-precheck.sql.',
      );
    console.log(
      'Configuração local, Supabase Auth e RPCs: OK. Nenhum e-mail enviado, nenhuma conta criada.',
    );
    console.log(
      'A validade das chaves e templates do EmailJS só será confirmada no teste de envio.',
    );
  } catch (error) {
    console.error('Falha:', error.code ?? 'CONEXAO', error.message);
    process.exitCode = 1;
  }
}
