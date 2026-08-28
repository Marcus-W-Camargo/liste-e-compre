import { configProblems, getConfig } from '../server/config.mjs';
import { createProviders } from '../server/providers.mjs';
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
    await createProviders(getConfig()).assertReady();
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
