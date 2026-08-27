import { createClient } from '@supabase/supabase-js';
import { AuthError } from './errors.mjs';

export function createEmailSender(env, request = fetch) {
  // Os valores já existentes podem ser reutilizados; os novos nomes não vão ao bundle.
  const publicKey = env.EMAILJS_PUBLIC_KEY || env.VITE_EMAILJS_PUBLIC_KEY;
  const serviceId = env.EMAILJS_SERVICE_ID || env.VITE_EMAILJS_SERVICE_ID;
  const signupTemplate = env.EMAILJS_TEMPLATE_CADASTRO_ID || env.VITE_EMAILJS_TEMPLATE_CADASTRO_ID;
  const recoveryTemplate = env.EMAILJS_TEMPLATE_RECUPERACAO_ID || env.VITE_EMAILJS_TEMPLATE_RECUPERACAO_ID;
  if (!publicKey || !serviceId || !signupTemplate || !recoveryTemplate || !env.EMAILJS_PRIVATE_KEY) {
    throw new AuthError(503, 'O envio de e-mail ainda não foi configurado no servidor.');
  }
  return async ({ type, email, name, code }) => {
    try {
      const response = await request('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: publicKey,
          accessToken: env.EMAILJS_PRIVATE_KEY,
          service_id: serviceId,
          template_id: type === 'cadastro' ? signupTemplate : recoveryTemplate,
          template_params: { to_email: email, nome: name, codigo: code,
            ...(type === 'recuperacao' ? { recuperar: code } : {}) },
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error('EmailJS unavailable');
    } catch {
      throw new AuthError(503, 'Não foi possível enviar o código. Aguarde um minuto e tente novamente.');
    }
  };
}

export function createAccounts(env, request = fetch) {
  // Chamado apenas DEPOIS de consumir a prova de confirmação no Redis.
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const secret = env.SUPABASE_SECRET_KEY;
  if (!url?.startsWith('https://') || !secret || env.AUTH_ADMIN_SIGNUPS_ONLY !== 'true') {
    throw new AuthError(503, 'A autenticação ainda não foi configurada no servidor.');
  }
  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => request(input, { ...init, signal: AbortSignal.timeout(10000) }) },
  });
  return {
    async signup(email, password, name) {
      // Defesa adicional contra publicação com cadastro público ainda habilitado.
      // Até este ponto a prova já foi validada e consumida pelo handler.
      const settingsResponse = await request(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
        headers: { apikey: secret }, signal: AbortSignal.timeout(8000),
      });
      const settings = await settingsResponse.json();
      if (!settingsResponse.ok || settings.disable_signup !== true) {
        throw new AuthError(503, 'O cadastro seguro ainda não foi ativado no servidor.');
      }
      const { error } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: name },
      });
      if (error?.code === 'email_exists' || error?.code === 'user_already_exists') {
        throw new AuthError(409, 'Este e-mail já possui uma conta. Entre ou recupere sua senha.');
      }
      if (error) throw new AuthError(503, 'Não foi possível criar a conta. Solicite outro código e tente novamente.');
    },
    async reset(email, password) {
      const { data: userId, error: lookupError } = await supabase.rpc('lc_auth_user_id_by_email', { p_email: email });
      if (lookupError) throw new AuthError(503, 'Não foi possível redefinir a senha. Solicite outro código.');
      if (!userId) throw new AuthError(400, 'Não há uma conta para este e-mail. Você pode se cadastrar.');
      const { error } = await supabase.auth.admin.updateUserById(userId, { password });
      if (error) throw new AuthError(503, 'Não foi possível redefinir a senha. Solicite outro código.');
    },
  };
}
