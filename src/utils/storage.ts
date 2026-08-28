// Adaptador síncrono para preservar a lógica das telas. A persistência é feita pela fila cloud.
import type {
  CompraFinalizada,
  DadosConta,
  Item,
  ItemCompra,
  ListaSalva,
  SessaoCompra,
} from '../types';
import { cloud } from '../services/cloudData';
import { obterSessao } from './auth';
export function gerarId() {
  return crypto.randomUUID();
}
function dados(email: string): DadosConta {
  const state = cloud.getSnapshot(),
    session = obterSessao();
  if (!session.logado || state.owner !== session.id || email !== session.email)
    throw new Error('Dados da conta ainda não carregados.');
  return structuredClone(state.data);
}
function mudar(email: string, fn: (data: DadosConta) => void) {
  dados(email);
  cloud.mutate(fn);
}
export function carregarListaAtual(email: string) {
  return dados(email).itens;
}
export function carregarEdicaoAtual(email: string) {
  return dados(email).edicaoId;
}
export function salvarListaAtual(
  email: string,
  itens: Item[],
  edicaoId: string | null = null,
) {
  mudar(email, (d) => {
    d.itens = structuredClone(itens);
    d.edicaoId = edicaoId;
  });
}
export function limparListaAtual(email: string) {
  mudar(email, (d) => {
    d.itens = [];
    d.edicaoId = null;
  });
}
export function carregarHistoricoListas(email: string) {
  return dados(email).historico;
}
export function salvarHistoricoListas(email: string, historico: ListaSalva[]) {
  mudar(email, (d) => {
    d.historico = structuredClone(historico);
  });
}
export function adicionarListaAoHistorico(
  email: string,
  nome: string,
  itens: Item[],
): ListaSalva {
  const lista = {
    id: gerarId(),
    nome,
    itens: structuredClone(itens),
    data: new Date().toISOString(),
  };
  mudar(email, (d) => {
    d.historico.push(lista);
  });
  return lista;
}
export function atualizarListaNoHistorico(
  email: string,
  id: string,
  itens: Item[],
): ListaSalva | null {
  const old = dados(email).historico.find((l) => l.id === id);
  if (!old) return null;
  const updated = {
    ...old,
    itens: structuredClone(itens),
    data: new Date().toISOString(),
  };
  mudar(email, (d) => {
    d.historico = d.historico.map((l) => (l.id === id ? updated : l));
  });
  return updated;
}
export function removerListaDoHistorico(email: string, id: string) {
  mudar(email, (d) => {
    d.historico = d.historico.filter((l) => l.id !== id);
    if (d.edicaoId === id) d.edicaoId = null;
    if (d.sessao?.listaId === id) d.sessao = null;
  });
}
export function renomearListaNoHistorico(
  email: string,
  id: string,
  nome: string,
) {
  mudar(email, (d) => {
    d.historico = d.historico.map((l) => (l.id === id ? { ...l, nome } : l));
    if (d.sessao?.listaId === id) d.sessao.nomeLista = nome;
  });
}
export function atualizarDataPrevistaNoHistorico(
  email: string,
  id: string,
  dataPrevista?: string,
): ListaSalva | null {
  const old = dados(email).historico.find((l) => l.id === id);
  if (!old) return null;
  const updated = { ...old, dataPrevista, data: new Date().toISOString() };
  mudar(email, (d) => {
    d.historico = d.historico.map((l) => (l.id === id ? updated : l));
    if (d.sessao?.listaId === id) d.sessao.dataPrevista = dataPrevista;
  });
  return updated;
}
export function criarSessaoCompra(
  email: string,
  lista: ListaSalva,
): SessaoCompra {
  const existing = dados(email).sessao;
  if (existing?.listaId === lista.id) return existing;
  const sessao: SessaoCompra = {
    id: gerarId(),
    listaId: lista.id,
    nomeLista: lista.nome,
    dataInicio: new Date().toISOString(),
    dataPrevista: lista.dataPrevista,
    itens: lista.itens.map((i): ItemCompra => ({
      ...i,
      precoUnitario: i.preco ?? 0,
      pego: false,
      origem: 'planejado',
      quantidadePlanejada: i.quantidade,
    })),
  };
  salvarSessaoCompra(email, sessao);
  return sessao;
}
export function carregarSessaoCompra(email: string) {
  return dados(email).sessao;
}
export function salvarSessaoCompra(email: string, sessao: SessaoCompra) {
  mudar(email, (d) => {
    d.sessao = structuredClone(sessao);
  });
}
export function limparSessaoCompra(email: string) {
  mudar(email, (d) => {
    d.sessao = null;
  });
}
export function adicionarItensAListaSalva(
  email: string,
  id: string,
  itens: Item[],
) {
  mudar(email, (d) => {
    d.historico = d.historico.map((l) =>
      l.id === id
        ? {
            ...l,
            itens: [...l.itens, ...itens.map((i) => ({ ...i, id: gerarId() }))],
            data: new Date().toISOString(),
          }
        : l,
    );
  });
}
export function finalizarCompra(email: string, compra: CompraFinalizada) {
  mudar(email, (d) => {
    if (!d.compras.some((c) => c.id === compra.id))
      d.compras.push(structuredClone(compra));
    d.historico = d.historico.filter((l) => l.id !== compra.listaId);
    d.sessao = null;
    if (d.edicaoId === compra.listaId) {
      d.edicaoId = null;
      d.itens = [];
    }
  });
}
export function carregarComprasFinalizadas(email: string) {
  return dados(email).compras;
}
