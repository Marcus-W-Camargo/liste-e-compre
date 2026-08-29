import { afterEach, describe, expect, it } from 'vitest';
import { somenteDadosRemotos } from '../src/services/cloudData';
import type { DadosConta, SessaoCompra } from '../src/types';
import {
  carregarSessaoCompraLocal,
  limparSessaoCompraLocal,
  salvarSessaoCompraLocal,
} from '../src/utils/localPurchaseSession';

const owner = 'usuario-teste';
const sessao: SessaoCompra = {
  id: 'sessao-1',
  listaId: 'lista-1',
  nomeLista: 'Mercado',
  dataInicio: '2026-08-29T00:00:00.000Z',
  itens: [
    {
      id: 'item-1',
      nome: 'Arroz',
      quantidade: 2,
      tipo: 'un',
      categoria: '🍞 Mercearia',
      precoUnitario: 6,
      pego: true,
      origem: 'planejado',
    },
  ],
};

afterEach(() => {
  localStorage.clear();
});

describe('compra em andamento local', () => {
  it('persiste e recupera a sessão separada por conta', () => {
    salvarSessaoCompraLocal(owner, sessao);

    expect(carregarSessaoCompraLocal(owner)).toEqual(sessao);
    expect(carregarSessaoCompraLocal('outro-usuario')).toBeNull();
  });

  it('descarta conteúdo local adulterado ou incompatível', () => {
    localStorage.setItem(
      'liste-e-compre:compra-em-andamento:usuario-teste',
      JSON.stringify({ ...sessao, itens: [{ id: 'inválido' }] }),
    );

    expect(carregarSessaoCompraLocal(owner)).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('retira a sessão do payload remoto e preserva a cópia local', () => {
    const dados: DadosConta = {
      itens: [],
      historico: [],
      sessao,
      compras: [],
      edicaoId: null,
    };

    expect(somenteDadosRemotos(owner, dados).sessao).toBeNull();
    expect(carregarSessaoCompraLocal(owner)).toEqual(sessao);

    limparSessaoCompraLocal(owner);
    expect(carregarSessaoCompraLocal(owner)).toBeNull();
  });
});
