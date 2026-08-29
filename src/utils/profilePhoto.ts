const PREFIXO_FOTO_PERFIL = 'liste-e-compre:foto-perfil:v1:';

interface FotoPerfilSalva {
  versao: 1;
  imagem: string;
}

function chaveFotoPerfil(usuarioId: string): string {
  return `${PREFIXO_FOTO_PERFIL}${usuarioId}`;
}

export function carregarFotoPerfil(usuarioId: string): string | null {
  if (!usuarioId) return null;

  try {
    const valor = localStorage.getItem(chaveFotoPerfil(usuarioId));
    if (!valor) return null;

    const registro = JSON.parse(valor) as Partial<FotoPerfilSalva>;
    return registro.versao === 1 &&
      typeof registro.imagem === 'string' &&
      registro.imagem.startsWith('data:image/')
      ? registro.imagem
      : null;
  } catch {
    return null;
  }
}

export function salvarFotoPerfil(usuarioId: string, imagem: string): boolean {
  if (!usuarioId || !imagem.startsWith('data:image/')) return false;

  try {
    const registro: FotoPerfilSalva = { versao: 1, imagem };
    localStorage.setItem(chaveFotoPerfil(usuarioId), JSON.stringify(registro));
    return true;
  } catch {
    return false;
  }
}

export function removerFotoPerfil(usuarioId: string): boolean {
  if (!usuarioId) return false;

  try {
    localStorage.removeItem(chaveFotoPerfil(usuarioId));
    return true;
  } catch {
    return false;
  }
}
