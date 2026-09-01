import { obterSupabase } from '../config/supabase';
import { limparSessaoCompraLocal } from './localPurchaseSession';
import { removerFotoPerfilLocal } from './profilePhoto';

const CHAVE_DISPOSITIVO = 'liste-e-compre:device-id:v1';

function criarIdDispositivo() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function obterIdDispositivo() {
  const existente = localStorage.getItem(CHAVE_DISPOSITIVO);
  if (existente) return existente;

  const criado = criarIdDispositivo();
  localStorage.setItem(CHAVE_DISPOSITIVO, criado);
  return criado;
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

export async function solicitarExclusaoConta() {
  await chamarExclusao({
    action: 'request',
    deviceId: obterIdDispositivo(),
  });
}

export async function validarExclusaoConta(token: string) {
  await chamarExclusao({
    action: 'validate',
    token,
    deviceId: obterIdDispositivo(),
  });
}

export async function confirmarExclusaoConta(usuarioId: string, token: string) {
  const { client } = await chamarExclusao({
    action: 'confirm',
    token,
    deviceId: obterIdDispositivo(),
  });

  limparDadosLocaisDaConta(usuarioId);
  await client.auth.signOut({ scope: 'local' }).catch(() => {});
}
