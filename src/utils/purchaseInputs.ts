export const PRECO_MAXIMO_COMPRA = 9_999.99;
export const QUANTIDADE_MAXIMA_UN = 999;

const formatadorPreco = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatarPrecoCompra(valor: number): string {
  const valorSeguro = Number.isFinite(valor)
    ? Math.min(PRECO_MAXIMO_COMPRA, Math.max(0, valor))
    : 0;

  return formatadorPreco.format(Math.round(valorSeguro * 100) / 100);
}

export function mascaraPrecoCompra(valor: string): number {
  const apenasNumeros = valor.replace(/\D/g, '');

  if (!apenasNumeros) {
    return 0;
  }

  const centavos = Math.min(999_999, parseInt(apenasNumeros, 10));
  return centavos / 100;
}

export function limitarQuantidadeUn(valor: string | number): number {
  const numero =
    typeof valor === 'number'
      ? Math.trunc(valor)
      : parseInt(valor.replace(/\D/g, '') || '0', 10);

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return Math.min(QUANTIDADE_MAXIMA_UN, Math.max(0, numero));
}
