import { createClient } from '@supabase/supabase-js';
import { AppError } from './errors.mjs';

export function classifyEmailError(status, message = '') {
  const text = message.toLowerCase();
  if (status === 429 || /quota|limit/.test(text)) return 'LIMITE_EMAILJS';
  if (/template/.test(text)) return 'TEMPLATE_EMAILJS';
  if (/service/.test(text)) return 'SERVICO_EMAILJS';
  if (/private|access.?token/.test(text)) return 'CHAVE_PRIVADA_EMAILJS';
  if (/public|user.?id|account/.test(text)) return 'CONTA_EMAILJS';
  if (/non.?browser|origin|browser/.test(text)) return 'PERMISSAO_EMAILJS';
  return 'ENVIO_EMAILJS';
}

export function createProviders(config, request = fetch) {
  const url = config.SUPABASE_URL.replace(/\/$/, '');
  const client = createClient(url, config.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        request(input, { ...init, signal: AbortSignal.timeout(10000) }),
    },
  });
  async function rpc(name, params = {}) {
    const { data, error } = await client.rpc(name, params);
    if (error) {
      console.warn(
        '[Supabase] Falha na operação:',
        name,
        /^[A-Z0-9_]+$/.test(error.code ?? '') ? error.code : 'RPC',
      );
      if (name === 'lc_auth_email_exists' && error.code === 'PGRST202')
        throw new AppError(
          503,
          'CONSULTA_EMAIL_NAO_CONFIGURADA',
          'A consulta de e-mail ainda não foi configurada. O responsável deve executar supabase/04-email-precheck.sql no Supabase.',
        );
      throw new AppError(
        503,
        'BANCO_INDISPONIVEL',
        'Não foi possível acessar a verificação. Confira a conexão e a configuração do banco.',
      );
    }
    return data;
  }
  return {
    rpc,
    async assertReady() {
      // Detecta configuração incompleta ANTES de gastar a cota de envio ou consumir o código.
      let response;
      try {
        response = await request(`${url}/auth/v1/settings`, {
          headers: { apikey: config.SUPABASE_SECRET_KEY },
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok || (await response.json()).disable_signup !== true)
          throw new Error();
      } catch {
        throw new AppError(
          503,
          'CADASTRO_PUBLICO',
          'O cadastro seguro ainda não foi configurado. Confira o Supabase Auth.',
        );
      }
      await rpc('lc_auth_health');
    },
    async send({ purpose, email, name, code }) {
      let response;
      try {
        response = await request(
          'https://api.emailjs.com/api/v1.0/email/send',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              service_id: config.EMAILJS_SERVICE_ID,
              template_id:
                purpose === 'cadastro'
                  ? config.EMAILJS_TEMPLATE_CADASTRO_ID
                  : config.EMAILJS_TEMPLATE_RECUPERACAO_ID,
              user_id: config.EMAILJS_PUBLIC_KEY,
              accessToken: config.EMAILJS_PRIVATE_KEY,
              template_params: {
                to_email: email,
                nome: name,
                codigo: code,
                ...(purpose === 'recuperacao' ? { recuperar: code } : {}),
              },
            }),
            signal: AbortSignal.timeout(10000),
          },
        );
      } catch {
        console.warn('[EmailJS] Categoria: CONEXAO_EMAILJS');
        throw new AppError(
          503,
          'ENVIO_FALHOU',
          'Não foi possível confirmar o envio do e-mail. Tente iniciar o cadastro novamente.',
        );
      }
      if (!response.ok) {
        const category = classifyEmailError(
          response.status,
          await response.text(),
        );
        // Nunca registrar corpo da resposta, endereço, código ou credenciais.
        console.warn(
          '[EmailJS] HTTP:',
          response.status,
          'Categoria:',
          category,
        );
        throw new AppError(
          503,
          'ENVIO_FALHOU',
          'Não foi possível enviar o código. O responsável pelo site deve conferir o serviço de e-mail.',
        );
      }
    },
    async signup(email, password, name) {
      const { error } = await client.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      });
      if (
        error &&
        ['email_exists', 'user_already_exists'].includes(error.code)
      ) {
        throw new AppError(
          409,
          'CONTA_EXISTENTE',
          'Este e-mail já possui uma conta. Entre ou recupere sua senha.',
        );
      }
      if (error)
        throw new AppError(
          503,
          'CADASTRO_FALHOU',
          'Não foi possível concluir o cadastro. Tente entrar; se a conta não existir, reinicie o cadastro.',
        );
    },
    async reset(email, password) {
      const id = await rpc('lc_auth_find_user', { p_email: email });
      if (!id)
        throw new AppError(
          400,
          'CONTA_INEXISTENTE',
          'Não existe uma conta confirmada para esse e-mail. Você pode se cadastrar.',
        );
      const { error } = await client.auth.admin.updateUserById(id, {
        password,
      });
      if (error)
        throw new AppError(
          503,
          'RECUPERACAO_FALHOU',
          'Não foi possível concluir a recuperação. Inicie uma nova tentativa.',
        );
    },
  };
}
