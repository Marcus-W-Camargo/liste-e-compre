export type ModoGuiaNavegacao = 'mobile' | 'desktop';

const PREFIXO = 'liste-e-compre:aviso:';

function chaveConexao(usuarioId: string) {
  return `${PREFIXO}conexao:v1:${usuarioId}`;
}

function chaveGuia(usuarioId: string, modo: ModoGuiaNavegacao) {
  return `${PREFIXO}navegacao:v1:${usuarioId}:${modo}`;
}

function foiVisto(chave: string) {
  try {
    return localStorage.getItem(chave) === '1';
  } catch {
    return false;
  }
}

function marcarComoVisto(chave: string) {
  try {
    localStorage.setItem(chave, '1');
  } catch {
    // Se o navegador bloquear o armazenamento, o aviso poderá reaparecer.
  }
}

export function deveMostrarAvisoConexao(
  usuarioId: string,
  quantidadeListasAntesDeSalvar: number,
) {
  return (
    Boolean(usuarioId) &&
    quantidadeListasAntesDeSalvar === 0 &&
    !foiVisto(chaveConexao(usuarioId))
  );
}

export function marcarAvisoConexaoComoVisto(usuarioId: string) {
  if (usuarioId) marcarComoVisto(chaveConexao(usuarioId));
}

export function deveMostrarGuiaNavegacao(
  usuarioId: string,
  modo: ModoGuiaNavegacao,
) {
  return Boolean(usuarioId) && !foiVisto(chaveGuia(usuarioId, modo));
}

export function marcarGuiaNavegacaoComoVisto(
  usuarioId: string,
  modo: ModoGuiaNavegacao,
) {
  if (usuarioId) marcarComoVisto(chaveGuia(usuarioId, modo));
}
