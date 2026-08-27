import type { CompraFinalizada, Item, ItemCompra, ListaSalva, SessaoCompra } from '../types';

function obterSufixoConta(email: string): string {
  return encodeURIComponent(email.trim().toLowerCase());
}

function obterChavesConta(email: string) {
  const sufixo = obterSufixoConta(email);

  return {
    carrinho: `carrinho_compras_${sufixo}`,
    historico: `historico_listas_${sufixo}`,
    sessaoCompra: `sessao_compra_${sufixo}`,
    comprasFinalizadas: `compras_finalizadas_${sufixo}`,
  };
}

export function gerarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizarItem(item: any): Item {
  return {
    id: item.id ?? gerarId(),
    nome: item.nome,
    quantidade: item.quantidade,
    tipo: item.tipo === 'Kg' ? 'Kg' : 'un',
    categoria: item.categoria,
    preco: item.preco,
    comprado: item.comprado ?? false,
  };
}

export function carregarListaAtual(email: string): Item[] {
  try {
    if (!email) return [];

    const raw = localStorage.getItem(obterChavesConta(email).carrinho);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as any[];
    return parsed.map(normalizarItem);
  } catch {
    return [];
  }
}

export function salvarListaAtual(email: string, lista: Item[]): void {
  if (!email) return;

  localStorage.setItem(
    obterChavesConta(email).carrinho,
    JSON.stringify(lista),
  );
}

export function limparListaAtual(email: string): void {
  if (!email) return;

  localStorage.removeItem(obterChavesConta(email).carrinho);
}

export function carregarHistoricoListas(email: string): ListaSalva[] {
  try {
    if (!email) return [];

    const raw = localStorage.getItem(obterChavesConta(email).historico);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as any[];

    return parsed.map((lista) => ({
      id: lista.id ?? gerarId(),
      nome: lista.nome,
      itens: (lista.itens ?? []).map(normalizarItem),
      data: lista.data ?? new Date().toISOString(),
      dataPrevista:
        typeof lista.dataPrevista === 'string' ? lista.dataPrevista : undefined,
    }));
  } catch {
    return [];
  }
}

export function salvarHistoricoListas(
  email: string,
  historico: ListaSalva[],
): void {
  if (!email) return;

  localStorage.setItem(
    obterChavesConta(email).historico,
    JSON.stringify(historico),
  );
}

export function adicionarListaAoHistorico(
  email: string,
  nome: string,
  itens: Item[],
): ListaSalva {
  const historico = carregarHistoricoListas(email);

  const novaLista: ListaSalva = {
    id: gerarId(),
    nome,
    itens: [...itens],
    data: new Date().toISOString(),
  };

  salvarHistoricoListas(email, [...historico, novaLista]);

  return novaLista;
}

export function atualizarListaNoHistorico(
  email: string,
  id: string,
  itens: Item[],
): ListaSalva | null {
  const historico = carregarHistoricoListas(email);
  const listaEncontrada = historico.find((lista) => lista.id === id);

  if (!listaEncontrada) return null;

  const listaAtualizada: ListaSalva = {
    ...listaEncontrada,
    itens: [...itens],
    data: new Date().toISOString(),
  };

  salvarHistoricoListas(
    email,
    historico.map((lista) =>
      lista.id === id ? listaAtualizada : lista,
    ),
  );

  return listaAtualizada;
}

export function removerListaDoHistorico(email: string, id: string): void {
  const historico = carregarHistoricoListas(email).filter(
    (lista) => lista.id !== id,
  );

  salvarHistoricoListas(email, historico);
}

export function renomearListaNoHistorico(
  email: string,
  id: string,
  nome: string,
): void {
  const historico = carregarHistoricoListas(email).map((lista) =>
    lista.id === id ? { ...lista, nome } : lista,
  );

  salvarHistoricoListas(email, historico);
}

export function atualizarDataPrevistaNoHistorico(
  email: string,
  id: string,
  dataPrevista?: string,
): ListaSalva | null {
  const historico = carregarHistoricoListas(email);
  const listaEncontrada = historico.find((lista) => lista.id === id);

  if (!listaEncontrada) return null;

  const listaAtualizada: ListaSalva = {
    ...listaEncontrada,
    dataPrevista,
    data: new Date().toISOString(),
  };

  salvarHistoricoListas(
    email,
    historico.map((lista) =>
      lista.id === id ? listaAtualizada : lista,
    ),
  );

  return listaAtualizada;
}

export function criarSessaoCompra(email: string, lista: ListaSalva): SessaoCompra {
  const existente = carregarSessaoCompra(email);
  if (existente?.listaId === lista.id) return existente;
  const sessao: SessaoCompra = { id: gerarId(), listaId: lista.id, nomeLista: lista.nome, dataInicio: new Date().toISOString(), dataPrevista: lista.dataPrevista, itens: lista.itens.map((item): ItemCompra => ({ ...item, precoUnitario: item.preco ?? 0, pego: false, origem: 'planejado', quantidadePlanejada: item.quantidade })) };
  salvarSessaoCompra(email, sessao);
  return sessao;
}

export function carregarSessaoCompra(email: string): SessaoCompra | null {
  try { const raw = localStorage.getItem(obterChavesConta(email).sessaoCompra); return raw ? JSON.parse(raw) as SessaoCompra : null; } catch { return null; }
}
export function salvarSessaoCompra(email: string, sessao: SessaoCompra): void { if (email) localStorage.setItem(obterChavesConta(email).sessaoCompra, JSON.stringify(sessao)); }
export function limparSessaoCompra(email: string): void { if (email) localStorage.removeItem(obterChavesConta(email).sessaoCompra); }
export function adicionarItensAListaSalva(email: string, id: string, itens: Item[]): void {
  const listas = carregarHistoricoListas(email).map((lista) => lista.id === id ? { ...lista, itens: [...lista.itens, ...itens], data: new Date().toISOString() } : lista);
  salvarHistoricoListas(email, listas);
}
export function finalizarCompra(email: string, compra: CompraFinalizada): void {
  const chaves = obterChavesConta(email);
  const anteriores = carregarComprasFinalizadas(email);
  localStorage.setItem(chaves.comprasFinalizadas, JSON.stringify([...anteriores, compra]));
  removerListaDoHistorico(email, compra.listaId);
  limparSessaoCompra(email);
}
export function carregarComprasFinalizadas(email: string): CompraFinalizada[] {
  try { const raw = localStorage.getItem(obterChavesConta(email).comprasFinalizadas); return raw ? JSON.parse(raw) as CompraFinalizada[] : []; } catch { return []; }
}
