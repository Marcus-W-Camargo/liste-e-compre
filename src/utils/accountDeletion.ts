import { obterSupabase } from '../config/supabase';
import { limparSessaoCompraLocal } from './localPurchaseSession';
import { removerFotoPerfilLocal } from './profilePhoto';

export function limparDadosLocaisDaConta(usuarioId: string) {
  limparSessaoCompraLocal(usuarioId);
  removerFotoPerfilLocal(usuarioId);

  const prefixos = ['liste-e-compre:url-foto-perfil:v1:'];
  for (const prefixo of prefixos)
    sessionStorage.removeItem(`${prefixo}${usuarioId}`);

  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (
      key &&
      key.includes(usuarioId) &&
      key.startsWith('liste-e-compre:')
    ) {
      localStorage.removeItem(key);
    }
  }
}

export async function excluirConta(usuarioId: string) {
  const client = obterSupabase();
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token)
    throw new Error(
      'Sua sessão expirou. Entre novamente antes de excluir a conta.',
    );

  const resposta = await fetch('/api/account', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const resultado = await resposta.json().catch(() => ({}));
  if (!resposta.ok)
    throw new Error(
      resultado?.error || 'Não foi possível excluir a conta agora.',
    );

  limparDadosLocaisDaConta(usuarioId);
  await client.auth.signOut({ scope: 'local' }).catch(() => {});
}
