import type { User } from '@supabase/supabase-js';
import { obterSupabase } from '../config/supabase';
export interface SessaoUsuario {
  logado: boolean;
  carregando: boolean;
  id: string;
  nome: string;
  email: string;
}
const vazia: SessaoUsuario = {
  logado: false,
  carregando: false,
  id: '',
  nome: '',
  email: '',
};
let sessao: SessaoUsuario = { ...vazia, carregando: true };
let inicializacao: Promise<void> | undefined;
let revisao = 0;
const ouvintes = new Set<() => void>();
export function obterSessao() {
  return sessao;
}
export function observarSessao(fn: () => void) {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}
function publicar(user: User | null) {
  sessao =
    user?.email && user.email_confirmed_at
      ? {
          logado: true,
          carregando: false,
          id: user.id,
          email: user.email.toLowerCase(),
          nome:
            typeof user.user_metadata.full_name === 'string'
              ? user.user_metadata.full_name
              : 'Usuário',
        }
      : vazia;
  ouvintes.forEach((fn) => fn());
}
async function validarToken(token: string | undefined, versao: number) {
  try {
    if (!token) {
      if (versao === revisao) publicar(null);
      return;
    }
    const { data, error } = await obterSupabase().auth.getUser(token);
    if (versao === revisao) publicar(error ? null : data.user);
  } catch {
    if (versao === revisao) publicar(null);
  }
}
export function iniciarAuth() {
  if (inicializacao) return inicializacao;
  inicializacao = (async () => {
    try {
      const client = obterSupabase();
      client.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') return;
        const versao = ++revisao;
        if (event === 'SIGNED_OUT') {
          publicar(null);
          return;
        }
        // Fora do callback síncrono para não disputar o lock interno do SDK.
        setTimeout(() => void validarToken(session?.access_token, versao), 0);
      });
      const versao = ++revisao;
      const { data } = await client.auth.getSession();
      await validarToken(data.session?.access_token, versao);
    } catch {
      publicar(null);
    }
  })();
  return inicializacao;
}
export async function autenticarUsuario(email: string, password: string) {
  await iniciarAuth();
  const { data, error } = await obterSupabase().auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    if (error.code === 'invalid_credentials')
      throw new Error('E-mail ou senha inválidos.');
    if (error.status === 429)
      throw new Error('Muitas tentativas de login. Aguarde e tente novamente.');
    throw new Error(
      'Não foi possível entrar. Confira a conexão e a configuração do site.',
    );
  }
  await validarToken(data.session?.access_token, ++revisao);
  if (!sessao.logado)
    throw new Error(
      'Não foi possível confirmar sua sessão. Tente entrar novamente.',
    );
}
export async function limparSessao() {
  const { error } = await obterSupabase().auth.signOut({ scope: 'local' });
  if (error) throw new Error('Não foi possível sair. Tente novamente.');
  revisao++;
  publicar(null);
}
