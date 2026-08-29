import { describe, expect, it } from 'vitest';
import type { CompraFinalizada, ItemCompra } from '../src/types';
import {
  agruparItensDaCompra,
  criarItensParaRefazerCompra,
} from '../src/utils/purchaseHistory';

function item(
  id: string,
  nome: string,
  categoria: string,
  origem: 'planejado' | 'extra' = 'planejado',
): ItemCompra {
  return {
    id,
    nome,
    categoria,
    quantidade: 2,
    tipo: 'un',
    precoUnitario: 5,
    pego: true,
    origem,
  };
}

describe('ações do histórico de compras', () => {
  it('organiza todos os itens na ordem das categorias e envia desconhecidos para Outros', () => {
    const grupos = agruparItensDaCompra([
      item('1', 'Sabonete', '🧼 Higiene'),
      item('2', 'Item legado', 'Categoria antiga'),
      item('3', 'Arroz', '🍞 Mercearia'),
      item('4', 'Suco', 'Bebidas'),
    ]);

    expect(grupos.map((grupo) => grupo.categoria.label)).toEqual([
      '🍞 Mercearia',
      '🥤 Bebidas',
      '🧼 Higiene',
      '📦 Outros',
    ]);
    expect(grupos.at(-1)?.itens.map((produto) => produto.nome)).toEqual([
      'Item legado',
    ]);
  });

  it('cria uma nova lista com quantidades atuais, IDs novos e sem preços antigos', () => {
    const compra: CompraFinalizada = {
      id: 'compra-1',
      listaId: 'lista-antiga',
      nomeLista: 'Compra do mês',
      dataInicio: '2026-08-28T10:00:00.000Z',
      dataFim: '2026-08-28T11:00:00.000Z',
      valorTotal: 10,
      porcentagemFinal: 100,
      gastosAdicionais: 10,
      itens: [item('antigo', 'Esponja', 'Categoria antiga', 'extra')],
    };
    const novos = criarItensParaRefazerCompra(compra, () => 'novo-id');

    expect(novos).toEqual([
      {
        id: 'novo-id',
        nome: 'Esponja',
        quantidade: 2,
        tipo: 'un',
        categoria: '📦 Outros',
        comprado: false,
      },
    ]);
    expect(novos[0]).not.toHaveProperty('precoUnitario');
    expect(novos[0]).not.toHaveProperty('origem');
    expect(novos[0]).not.toHaveProperty('pego');
  });
});
