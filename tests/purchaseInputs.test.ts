import { describe, expect, it } from 'vitest';
import {
  formatarPrecoCompra,
  limitarQuantidadeUn,
  mascaraPrecoCompra,
} from '../src/utils/purchaseInputs';

describe('campos numéricos da compra', () => {
  it('aplica a máscara monetária brasileira de forma progressiva', () => {
    expect(formatarPrecoCompra(mascaraPrecoCompra(''))).toBe('0,00');
    expect(formatarPrecoCompra(mascaraPrecoCompra('1'))).toBe('0,01');
    expect(formatarPrecoCompra(mascaraPrecoCompra('12'))).toBe('0,12');
    expect(formatarPrecoCompra(mascaraPrecoCompra('123'))).toBe('1,23');
    expect(formatarPrecoCompra(mascaraPrecoCompra('1234'))).toBe('12,34');
    expect(formatarPrecoCompra(mascaraPrecoCompra('123456'))).toBe('1.234,56');
  });

  it('limita o preço a 9.999,99 e ignora caracteres não numéricos', () => {
    expect(mascaraPrecoCompra('R$ 9.999,99')).toBe(9_999.99);
    expect(mascaraPrecoCompra('9999999')).toBe(9_999.99);
    expect(formatarPrecoCompra(25_000)).toBe('9.999,99');
  });

  it('mantém a quantidade unitária entre 0 e 999', () => {
    expect(limitarQuantidadeUn('12 unidades')).toBe(12);
    expect(limitarQuantidadeUn('9999')).toBe(999);
    expect(limitarQuantidadeUn(-1)).toBe(0);
    expect(limitarQuantidadeUn(1_000)).toBe(999);
  });
});
