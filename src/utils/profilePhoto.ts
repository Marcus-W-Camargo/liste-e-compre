import { obterSupabase } from '../config/supabase';

const BALDE_FOTOS_PERFIL = 'profile-photos';
const PREFIXO_FOTO_PERFIL_LOCAL = 'liste-e-compre:foto-perfil:v1:';
const TAMANHO_MAXIMO_FOTO_SINCRONIZADA = 2 * 1024 * 1024;

interface FotoPerfilSalvaLocal {
  versao: 1;
  imagem: string;
}

interface ErroStorage {
  message?: string;
  statusCode?: number | string;
}

function caminhoFotoPerfil(usuarioId: string): string {
  return `${usuarioId}/avatar.jpg`;
}

function chaveFotoPerfilLocal(usuarioId: string): string {
  return `${PREFIXO_FOTO_PERFIL_LOCAL}${usuarioId}`;
}

function fotoNaoEncontrada(erro: ErroStorage): boolean {
  return Number(erro.statusCode) === 404 ||
    /not found|object not found/i.test(erro.message ?? '');
}

function dataUrlParaBlob(imagem: string): Blob {
  const resultado = /^data:(image\/jpeg);base64,([a-z\d+/=]+)$/i.exec(imagem);
  if (!resultado) throw new Error('O formato da foto recortada é inválido.');

  const binario = atob(resultado[2]);
  const bytes = new Uint8Array(binario.length);
  for (let indice = 0; indice < binario.length; indice += 1) {
    bytes[indice] = binario.charCodeAt(indice);
  }

  const foto = new Blob([bytes], { type: resultado[1].toLowerCase() });
  if (foto.size > TAMANHO_MAXIMO_FOTO_SINCRONIZADA) {
    throw new Error('A foto recortada ultrapassou o limite de 2 MB.');
  }
  return foto;
}

function blobParaDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () =>
      typeof leitor.result === 'string'
        ? resolve(leitor.result)
        : reject(new Error('Não foi possível abrir a foto sincronizada.'));
    leitor.onerror = () =>
      reject(new Error('Não foi possível abrir a foto sincronizada.'));
    leitor.readAsDataURL(blob);
  });
}

export function carregarFotoPerfilLocal(usuarioId: string): string | null {
  if (!usuarioId) return null;

  try {
    const valor = localStorage.getItem(chaveFotoPerfilLocal(usuarioId));
    if (!valor) return null;

    const registro = JSON.parse(valor) as Partial<FotoPerfilSalvaLocal>;
    return registro.versao === 1 &&
      typeof registro.imagem === 'string' &&
      registro.imagem.startsWith('data:image/')
      ? registro.imagem
      : null;
  } catch {
    return null;
  }
}

export function removerFotoPerfilLocal(usuarioId: string): void {
  if (!usuarioId) return;
  try {
    localStorage.removeItem(chaveFotoPerfilLocal(usuarioId));
  } catch {
    // Uma cópia antiga indisponível não impede a foto sincronizada de funcionar.
  }
}

export async function carregarFotoPerfil(usuarioId: string): Promise<string | null> {
  if (!usuarioId) return null;

  const { data, error } = await obterSupabase()
    .storage
    .from(BALDE_FOTOS_PERFIL)
    .download(caminhoFotoPerfil(usuarioId));

  if (error) {
    if (fotoNaoEncontrada(error)) return null;
    throw new Error('Não foi possível carregar a foto da sua conta.');
  }

  return blobParaDataUrl(data);
}

export async function salvarFotoPerfil(
  usuarioId: string,
  imagem: string,
): Promise<void> {
  if (!usuarioId) throw new Error('Não foi possível identificar a sua conta.');
  const foto = dataUrlParaBlob(imagem);
  const { error } = await obterSupabase()
    .storage
    .from(BALDE_FOTOS_PERFIL)
    .upload(caminhoFotoPerfil(usuarioId), foto, {
      cacheControl: '3600',
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw new Error('Não foi possível sincronizar a foto da sua conta.');
}

export async function removerFotoPerfil(usuarioId: string): Promise<void> {
  if (!usuarioId) throw new Error('Não foi possível identificar a sua conta.');
  const { error } = await obterSupabase()
    .storage
    .from(BALDE_FOTOS_PERFIL)
    .remove([caminhoFotoPerfil(usuarioId)]);

  if (error && !fotoNaoEncontrada(error)) {
    throw new Error('Não foi possível excluir a foto da sua conta.');
  }
}
