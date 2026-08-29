import { describe, expect, it } from 'vitest';
import type { SessaoCompra } from '../src/types';
import { resolverDestinoRetornoHistorico } from '../src/utils/purchaseNavigation';

const sessao: SessaoCompra = {
  id: 'sessao-1',
  listaId: 'lista-1',
  nomeLista: 'Mercado',
  dataInicio: '2026-08-29T00:00:00.000Z',
  itens: [],
};

describe('retorno do histórico para compras', () => {
  it('mantém o catálogo quando o histórico foi aberto pelo catálogo', () => {
    expect(
      resolverDestinoRetornoHistorico('/compre', sessao, ['lista-1']),
    ).toBe('/compre');
  });

  it('retoma a compra exata quando o histórico foi aberto por ela', () => {
    expect(
      resolverDestinoRetornoHistorico('/compre/lista-1', sessao, ['lista-1']),
    ).toBe('/compre/lista-1');
  });

  it('usa o catálogo em acesso direto ou com uma origem diferente', () => {
    expect(
      resolverDestinoRetornoHistorico(undefined, sessao, ['lista-1']),
    ).toBe('/compre');
    expect(
      resolverDestinoRetornoHistorico('/compre/lista-2', sessao, ['lista-1']),
    ).toBe('/compre');
  });

  it('não reabre uma compra cuja lista foi removida', () => {
    expect(
      resolverDestinoRetornoHistorico('/compre/lista-1', sessao, []),
    ).toBe('/compre');
  });
});
