import type { SessaoCompra } from '../types';

/**
 * O Histórico só reabre uma compra quando ele foi acessado por essa compra.
 * A existência de uma sessão local, isoladamente, nunca tira o usuário do catálogo.
 */
export function resolverDestinoRetornoHistorico(
  retornoSolicitado: unknown,
  sessaoEmAndamento: SessaoCompra | null,
  idsListasSalvas: string[],
) {
  if (!sessaoEmAndamento) return '/compre';

  const destinoDaSessao = `/compre/${sessaoEmAndamento.listaId}`;
  const listaAindaExiste = idsListasSalvas.includes(
    sessaoEmAndamento.listaId,
  );

  return retornoSolicitado === destinoDaSessao && listaAindaExiste
    ? destinoDaSessao
    : '/compre';
}
