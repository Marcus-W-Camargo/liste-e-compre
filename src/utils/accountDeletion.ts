import { obterSupabase } from '../config/supabase';
import { limparSessaoCompraLocal } from './localPurchaseSession';
import { removerFotoPerfilLocal } from './profilePhoto';

export interface TentativaExclusaoConta {
  id: string;
  token: string;
  sessionId: string;
}

function criarSegredoHex(bytes = 32) {
  const dados = new Uint8Array(bytes);
  crypto.getRandomValues(dados);
  return Array.from(dados, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

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

async function tokenDaSessao() {
  const client = obterSupabase();
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token)
    throw new Error(
      'Sua sessão expirou. Entre novamente antes de excluir a conta.',
    );
  return { client, token };
}

async function chamarExclusao(body: Record<string, string>) {
  const { client, token } = await tokenDaSessao();
  const resposta = await fetch('/api/account', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const resultado = await resposta.json().catch(() => ({}));
  if (!resposta.ok)
    throw new Error(
      resultado?.error || 'Não foi possível concluir a solicitação agora.',
    );
  return { client, resultado };
}

export async function solicitarExclusaoConta(): Promise<TentativaExclusaoConta> {
  const sessionId = criarSegredoHex();
  const { resultado } = await chamarExclusao({ action: 'request', sessionId });
  if (
    typeof resultado?.id !== 'string' ||
    typeof resultado?.token !== 'string'
  ) {
    throw new Error('Não foi possível iniciar a confirmação agora.');
  }
  return { id: resultado.id, token: resultado.token, sessionId };
}

export async function cancelarExclusaoConta(tentativa: TentativaExclusaoConta) {
  await chamarExclusao({
    action: 'cancel',
    id: tentativa.id,
    token: tentativa.token,
    sessionId: tentativa.sessionId,
  }).catch(() => {});
}

export async function confirmarExclusaoConta(
  usuarioId: string,
  tentativa: TentativaExclusaoConta,
  code: string,
) {
  const { client } = await chamarExclusao({
    action: 'confirm',
    id: tentativa.id,
    token: tentativa.token,
    sessionId: tentativa.sessionId,
    code,
  });

  limparDadosLocaisDaConta(usuarioId);
  await client.auth.signOut({ scope: 'local' }).catch(() => {});
}
