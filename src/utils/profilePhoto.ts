import { obterSupabase } from '../config/supabase';

const BALDE_FOTOS_PERFIL = 'profile-photos';
const PREFIXO_FOTO_PERFIL_LOCAL = 'liste-e-compre:foto-perfil:v1:';
const PREFIXO_URL_FOTO_PERFIL = 'liste-e-compre:url-foto-perfil:v1:';
const TAMANHO_MAXIMO_FOTO_SINCRONIZADA = 200 * 1024;
const TAMANHO_MAXIMO_LADO = 512;
const DURACAO_URL_ASSINADA = 24 * 60 * 60;
const MARGEM_EXPIRACAO_URL = 60 * 1000;
const QUALIDADES_JPEG = [0.88, 0.82, 0.76, 0.7, 0.64, 0.58, 0.52, 0.46];

interface FotoPerfilSalvaLocal {
  versao: 1;
  imagem: string;
}

interface UrlFotoPerfilCache {
  versao: 1;
  url: string;
  expiraEm: number;
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

function chaveUrlFotoPerfil(usuarioId: string): string {
  return `${PREFIXO_URL_FOTO_PERFIL}${usuarioId}`;
}

function fotoNaoEncontrada(erro: ErroStorage): boolean {
  return Number(erro.statusCode) === 404 ||
    /not found|object not found/i.test(erro.message ?? '');
}

function removerUrlFotoPerfilCache(usuarioId: string): void {
  if (!usuarioId) return;
  try {
    sessionStorage.removeItem(chaveUrlFotoPerfil(usuarioId));
  } catch {
    // A ausência de cache local não impede a foto sincronizada de funcionar.
  }
}

function carregarUrlFotoPerfilCache(usuarioId: string): string | null {
  if (!usuarioId) return null;

  try {
    const valor = sessionStorage.getItem(chaveUrlFotoPerfil(usuarioId));
    if (!valor) return null;

    const registro = JSON.parse(valor) as Partial<UrlFotoPerfilCache>;
    const urlValida = registro.versao === 1 &&
      typeof registro.url === 'string' &&
      registro.url.startsWith('https://') &&
      typeof registro.expiraEm === 'number' &&
      registro.expiraEm - MARGEM_EXPIRACAO_URL > Date.now();

    if (!urlValida) {
      removerUrlFotoPerfilCache(usuarioId);
      return null;
    }

    return registro.url ?? null;
  } catch {
    return null;
  }
}

function salvarUrlFotoPerfilCache(usuarioId: string, url: string): void {
  try {
    const registro: UrlFotoPerfilCache = {
      versao: 1,
      url,
      expiraEm: Date.now() + DURACAO_URL_ASSINADA * 1000,
    };
    sessionStorage.setItem(chaveUrlFotoPerfil(usuarioId), JSON.stringify(registro));
  } catch {
    // O cache em sessão é apenas uma otimização; a URL continua válida sem ele.
  }
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error('Não foi possível preparar a foto selecionada.'));
    imagem.src = src;
  });
}

function canvasParaBlob(canvas: HTMLCanvasElement, qualidade: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Não foi possível compactar a foto.')),
      'image/jpeg',
      qualidade,
    );
  });
}

async function dataUrlParaBlobOtimizado(imagem: string): Promise<Blob> {
  if (!/^data:image\/(?:jpeg|jpg|png);base64,/i.test(imagem)) {
    throw new Error('O formato da foto recortada é inválido.');
  }

  const original = await carregarImagem(imagem);
  const proporcao = Math.min(
    1,
    TAMANHO_MAXIMO_LADO / Math.max(original.naturalWidth, original.naturalHeight),
  );
  let largura = Math.max(1, Math.round(original.naturalWidth * proporcao));
  let altura = Math.max(1, Math.round(original.naturalHeight * proporcao));

  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const contexto = canvas.getContext('2d');
    if (!contexto) throw new Error('Não foi possível preparar a foto para envio.');

    contexto.fillStyle = '#fff';
    contexto.fillRect(0, 0, largura, altura);
    contexto.imageSmoothingEnabled = true;
    contexto.imageSmoothingQuality = 'high';
    contexto.drawImage(original, 0, 0, largura, altura);

    for (const qualidade of QUALIDADES_JPEG) {
      const foto = await canvasParaBlob(canvas, qualidade);
      if (foto.size < TAMANHO_MAXIMO_FOTO_SINCRONIZADA) return foto;
    }

    largura = Math.max(256, Math.round(largura * 0.85));
    altura = Math.max(256, Math.round(altura * 0.85));
  }

  throw new Error('Não foi possível reduzir a foto para menos de 200 KB. Escolha outra imagem.');
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

  const urlEmCache = carregarUrlFotoPerfilCache(usuarioId);
  if (urlEmCache) return urlEmCache;

  const { data, error } = await obterSupabase()
    .storage
    .from(BALDE_FOTOS_PERFIL)
    .createSignedUrl(caminhoFotoPerfil(usuarioId), DURACAO_URL_ASSINADA);

  if (error) {
    if (fotoNaoEncontrada(error)) return null;
    throw new Error('Não foi possível carregar a foto da sua conta.');
  }

  salvarUrlFotoPerfilCache(usuarioId, data.signedUrl);
  return data.signedUrl;
}

export async function salvarFotoPerfil(
  usuarioId: string,
  imagem: string,
): Promise<void> {
  if (!usuarioId) throw new Error('Não foi possível identificar a sua conta.');

  const foto = await dataUrlParaBlobOtimizado(imagem);
  const { error } = await obterSupabase()
    .storage
    .from(BALDE_FOTOS_PERFIL)
    .upload(caminhoFotoPerfil(usuarioId), foto, {
      cacheControl: '3600',
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw new Error('Não foi possível sincronizar a foto da sua conta.');
  removerUrlFotoPerfilCache(usuarioId);
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

  removerUrlFotoPerfilCache(usuarioId);
}
