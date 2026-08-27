import { useCallback, useEffect, useState } from 'react';
import type { Item, ListaSalva, TipoMedida } from '../types';
import {
  adicionarListaAoHistorico,
  atualizarListaNoHistorico,
  carregarHistoricoListas,
  carregarListaAtual,
  gerarId,
  limparListaAtual,
  removerListaDoHistorico,
  renomearListaNoHistorico,
  salvarListaAtual,
} from '../utils/storage';
import { obterSessao } from '../utils/auth';

type ResultadoSalvar =
  | { ok: true; lista: ListaSalva }
  | {
      ok: false;
      motivo: 'vazia' | 'nome-vazio' | 'nome-duplicado';
    };

export function useListaCompras() {
  const [itens, setItens] = useState<Item[]>([]);
  const [historico, setHistorico] = useState<ListaSalva[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('Geral');
  const [carregado, setCarregado] = useState(false);
  const [listaEmEdicaoId, setListaEmEdicaoId] = useState<string | null>(
    null,
  );
  const emailConta = obterSessao().email;

  useEffect(() => {
    setItens(carregarListaAtual(emailConta));
    setHistorico(carregarHistoricoListas(emailConta));
    setCarregado(true);
  }, [emailConta]);

  useEffect(() => {
    if (carregado) {
      salvarListaAtual(emailConta, itens);
    }
  }, [itens, carregado, emailConta]);

  const adicionarItem = useCallback(
    (dados: {
      nome: string;
      categoria: string;
      quantidade: number;
      tipo: TipoMedida;
    }) => {
      const novoItem: Item = {
        id: gerarId(),
        nome: dados.nome.trim(),
        categoria: dados.categoria,
        quantidade: dados.quantidade,
        tipo: dados.tipo,
        comprado: false,
      };

      setItens((atual) => [...atual, novoItem]);
    },
    [],
  );

  const atualizarItem = useCallback(
    (id: string, patch: Partial<Item>) => {
      setItens((atual) =>
        atual.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      );
    },
    [],
  );

  const removerItem = useCallback((id: string) => {
    setItens((atual) => atual.filter((item) => item.id !== id));
  }, []);

  const limparLista = useCallback(() => {
    setItens([]);
    setListaEmEdicaoId(null);
    limparListaAtual(emailConta);
  }, [emailConta]);

  const carregarListaSalva = useCallback(
    (id: string) => {
      const lista = historico.find((item) => item.id === id);

      if (!lista) return;

      setItens([...lista.itens]);
      setListaEmEdicaoId(lista.id);
      setFiltroCategoria('Geral');
    },
    [historico],
  );

  const salvarEdicaoAtual = useCallback(() => {
    if (!listaEmEdicaoId || itens.length === 0) {
      return null;
    }

    const listaAtualizada = atualizarListaNoHistorico(
      emailConta,
      listaEmEdicaoId,
      itens,
    );

    if (!listaAtualizada) {
      return null;
    }

    setHistorico((atual) =>
      atual.map((lista) =>
        lista.id === listaAtualizada.id ? listaAtualizada : lista,
      ),
    );

    setItens([]);
    setListaEmEdicaoId(null);
    limparListaAtual(emailConta);

    return listaAtualizada;
  }, [emailConta, itens, listaEmEdicaoId]);

  const salvarListaComNome = useCallback(
    (nome: string): ResultadoSalvar => {
      if (itens.length === 0) {
        return { ok: false, motivo: 'vazia' };
      }

      if (listaEmEdicaoId) {
        const listaAtualizada = salvarEdicaoAtual();

        if (!listaAtualizada) {
          return { ok: false, motivo: 'vazia' };
        }

        return { ok: true, lista: listaAtualizada };
      }

      const nomeLimpo = nome.trim();

      if (!nomeLimpo) {
        return { ok: false, motivo: 'nome-vazio' };
      }

      const nomeJaExiste = historico.some(
        (lista) =>
          lista.nome.toLowerCase() === nomeLimpo.toLowerCase(),
      );

      if (nomeJaExiste) {
        return { ok: false, motivo: 'nome-duplicado' };
      }

      const novaLista = adicionarListaAoHistorico(
        emailConta,
        nomeLimpo,
        itens,
      );

      setHistorico((atual) => [...atual, novaLista]);
      setItens([]);
      limparListaAtual(emailConta);

      return { ok: true, lista: novaLista };
    },
    [emailConta, historico, itens, listaEmEdicaoId, salvarEdicaoAtual],
  );

  const excluirListaSalva = useCallback((id: string) => {
    removerListaDoHistorico(emailConta, id);
    setHistorico((atual) =>
      atual.filter((lista) => lista.id !== id),
    );

    setListaEmEdicaoId((atual) => (atual === id ? null : atual));
  }, [emailConta]);

  const renomearListaSalva = useCallback(
    (
      id: string,
      nome: string,
    ):
      | { ok: true }
      | { ok: false; motivo: 'nome-vazio' | 'nome-duplicado' } => {
      const nomeLimpo = nome.trim();

      if (!nomeLimpo) {
        return { ok: false, motivo: 'nome-vazio' };
      }

      const nomeJaExiste = historico.some(
        (lista) =>
          lista.id !== id &&
          lista.nome.toLowerCase() === nomeLimpo.toLowerCase(),
      );

      if (nomeJaExiste) {
        return { ok: false, motivo: 'nome-duplicado' };
      }

      renomearListaNoHistorico(emailConta, id, nomeLimpo);

      setHistorico((atual) =>
        atual.map((lista) =>
          lista.id === id ? { ...lista, nome: nomeLimpo } : lista,
        ),
      );

      return { ok: true };
    },
    [emailConta, historico],
  );

  const itensFiltrados =
    filtroCategoria === 'Geral'
      ? itens
      : itens.filter(
          (item) =>
            item.categoria.includes(filtroCategoria) ||
            item.categoria === filtroCategoria,
        );

  return {
    itens,
    itensFiltrados,
    historico,
    filtroCategoria,
    setFiltroCategoria,
    carregado,
    adicionarItem,
    atualizarItem,
    removerItem,
    limparLista,
    salvarListaComNome,
    salvarEdicaoAtual,
    excluirListaSalva,
    renomearListaSalva,
    carregarListaSalva,
    listaEmEdicaoId,
  };
}