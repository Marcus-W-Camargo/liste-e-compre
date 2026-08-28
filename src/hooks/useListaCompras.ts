import { useState, useSyncExternalStore } from 'react';
import type { Item, ListaSalva, TipoMedida } from '../types';
import { cloud } from '../services/cloudData';
import {
  gerarId,
  removerListaDoHistorico,
  renomearListaNoHistorico,
} from '../utils/storage';
import { obterSessao } from '../utils/auth';
type ResultadoSalvar =
  | { ok: true; lista: ListaSalva }
  | { ok: false; motivo: 'vazia' | 'nome-vazio' | 'nome-duplicado' };
export function useListaCompras() {
  const { data } = useSyncExternalStore(cloud.subscribe, cloud.getSnapshot);
  const { itens, historico, edicaoId: listaEmEdicaoId } = data;
  const [filtroCategoria, setFiltroCategoria] = useState('Geral');
  function adicionarItem(dados: {
    nome: string;
    categoria: string;
    quantidade: number;
    tipo: TipoMedida;
  }) {
    cloud.mutate((d) => {
      d.itens.push({
        id: gerarId(),
        ...dados,
        nome: dados.nome.trim(),
        comprado: false,
      });
    });
  }
  function atualizarItem(id: string, patch: Partial<Item>) {
    cloud.mutate((d) => {
      d.itens = d.itens.map((i) => (i.id === id ? { ...i, ...patch } : i));
    });
  }
  function removerItem(id: string) {
    cloud.mutate((d) => {
      d.itens = d.itens.filter((i) => i.id !== id);
    });
  }
  function limparLista() {
    cloud.mutate((d) => {
      d.itens = [];
      d.edicaoId = null;
    });
  }
  function carregarListaSalva(id: string) {
    const lista = historico.find((l) => l.id === id);
    if (!lista) return;
    cloud.mutate((d) => {
      d.itens = structuredClone(lista.itens);
      d.edicaoId = id;
    });
    setFiltroCategoria('Geral');
  }
  function salvarEdicaoAtual(): ListaSalva | null {
    const lista = historico.find((l) => l.id === listaEmEdicaoId);
    if (!lista || !itens.length) return null;
    const updated = {
      ...lista,
      itens: structuredClone(itens),
      data: new Date().toISOString(),
    };
    cloud.mutate((d) => {
      d.historico = d.historico.map((l) => (l.id === lista.id ? updated : l));
      d.itens = [];
      d.edicaoId = null;
    });
    return updated;
  }
  function salvarListaComNome(nome: string): ResultadoSalvar {
    if (!itens.length) return { ok: false, motivo: 'vazia' };
    if (listaEmEdicaoId) {
      const lista = salvarEdicaoAtual();
      return lista ? { ok: true, lista } : { ok: false, motivo: 'vazia' };
    }
    const limpo = nome.trim();
    if (!limpo) return { ok: false, motivo: 'nome-vazio' };
    if (historico.some((l) => l.nome.toLowerCase() === limpo.toLowerCase()))
      return { ok: false, motivo: 'nome-duplicado' };
    const lista = {
      id: gerarId(),
      nome: limpo,
      itens: structuredClone(itens),
      data: new Date().toISOString(),
    };
    cloud.mutate((d) => {
      d.historico.push(lista);
      d.itens = [];
      d.edicaoId = null;
    });
    return { ok: true, lista };
  }
  function excluirListaSalva(id: string) {
    removerListaDoHistorico(obterSessao().email, id);
  }
  function renomearListaSalva(
    id: string,
    nome: string,
  ): { ok: true } | { ok: false; motivo: 'nome-vazio' | 'nome-duplicado' } {
    const limpo = nome.trim();
    if (!limpo) return { ok: false, motivo: 'nome-vazio' };
    if (
      historico.some(
        (l) => l.id !== id && l.nome.toLowerCase() === limpo.toLowerCase(),
      )
    )
      return { ok: false, motivo: 'nome-duplicado' };
    renomearListaNoHistorico(obterSessao().email, id, limpo);
    return { ok: true };
  }
  return {
    itens,
    historico,
    listaEmEdicaoId,
    filtroCategoria,
    setFiltroCategoria,
    carregado: true,
    itensFiltrados:
      filtroCategoria === 'Geral'
        ? itens
        : itens.filter(
            (i) =>
              i.categoria.includes(filtroCategoria) ||
              i.categoria === filtroCategoria,
          ),
    adicionarItem,
    atualizarItem,
    removerItem,
    limparLista,
    carregarListaSalva,
    salvarEdicaoAtual,
    salvarListaComNome,
    excluirListaSalva,
    renomearListaSalva,
  };
}
