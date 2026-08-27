import type { User } from '@supabase/supabase-js';
import { obterSupabase } from '../config/supabase';

export interface SessaoUsuario {
  logado: boolean;
  carregando: boolean;
  id: string;
  nome: string;
  email: string;
}
const vazia: SessaoUsuario = { logado: false, carregando: false, id: '', nome: '', email: '' };
let sessao: SessaoUsuario = { ...vazia, carregando: true };
let inicializacao: Promise<void> | undefined;
let revisao = 0;
const ouvintes = new Set<() => void>();

export function obterSessao() { return sessao; }
export function observarSessao(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => { ouvintes.delete(ouvinte); };
}
function publicarUsuario(user: User | null) {
  revisao++;
  sessao = user?.email && user.email_confirmed_at
    ? { logado: true, carregando: false, id: user.id, email: user.email.toLowerCase(),
      nome: typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : 'Usuário' }
    : vazia;
  ouvintes.forEach((ouvinte) => ouvinte());
}
export function iniciarAuth() {
  if (inicializacao) return inicializacao;
  inicializacao = (async () => {
    try {
      const supabase = obterSupabase();
      supabase.auth.onAuthStateChange((event, atual) => {
        if (event !== 'INITIAL_SESSION') publicarUsuario(atual?.user ?? null);
      });
      const versao = revisao;
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        if (versao === revisao) publicarUsuario(null);
        return;
      }
      // Não aceitamos antigos flags de login ou usuário inventado no localStorage.
      const { data: validada, error: erroValidacao } = await supabase.auth.getUser();
      if (versao === revisao) publicarUsuario(erroValidacao ? null : validada.user);
    } catch {
      publicarUsuario(null); // Configuração ausente não derruba a página inicial.
    }
  })();
  return inicializacao;
}
export async function autenticarUsuario(email: string, password: string) {
  await iniciarAuth();
  const { data, error } = await obterSupabase().auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === 'invalid_credentials') throw new Error('E-mail ou senha inválidos.');
    if (error.code === 'over_request_rate_limit') throw new Error('Muitas tentativas. Aguarde antes de tentar novamente.');
    throw new Error('Não foi possível entrar. Confira a conexão e tente novamente.');
  }
  if (!data.user.email_confirmed_at) {
    await obterSupabase().auth.signOut({ scope: 'local' });
    throw new Error('Confirme seu e-mail antes de entrar.');
  }
  publicarUsuario(data.user);
}
export async function limparSessao() {
  const { error } = await obterSupabase().auth.signOut({ scope: 'local' });
  if (error) throw new Error('Não foi possível sair. Confira a conexão e tente novamente.');
  publicarUsuario(null);
}
