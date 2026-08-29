import produtos from '../data/produtosMercado.json';

export const MINIMO_CARACTERES_PRODUTO = 3;
export const LIMITE_SUGESTOES_PRODUTO = 30;

interface ProdutoIndexado {
  nome: string;
  normalizado: string;
  palavras: string[];
  ordem: number;
}

export interface ResultadoBuscaProdutos {
  itens: string[];
  total: number;
}

export function normalizarBuscaProduto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();
}

const catalogo: ProdutoIndexado[] = produtos.map((nome, ordem) => {
  const normalizado = normalizarBuscaProduto(nome);
  return { nome, normalizado, palavras: normalizado.split(' '), ordem };
});

function contemPalavrasNaOrdem(
  palavrasProduto: string[],
  palavrasBusca: string[],
): boolean {
  let proximaPosicao = 0;

  for (const palavraBusca of palavrasBusca) {
    const indice = palavrasProduto.findIndex(
      (palavra, posicao) =>
        posicao >= proximaPosicao && palavra.startsWith(palavraBusca),
    );

    if (indice < 0) return false;
    proximaPosicao = indice + 1;
  }

  return true;
}

function pontuarProduto(
  produto: ProdutoIndexado,
  consulta: string,
  palavrasBusca: string[],
): number {
  if (produto.normalizado === consulta) return 0;
  if (produto.normalizado.startsWith(consulta)) return 1;
  if (contemPalavrasNaOrdem(produto.palavras, palavrasBusca)) return 2;
  if (produto.normalizado.includes(consulta)) return 3;
  return Number.POSITIVE_INFINITY;
}

export function buscarProdutos(
  valor: string,
  limite = LIMITE_SUGESTOES_PRODUTO,
): ResultadoBuscaProdutos {
  const consulta = normalizarBuscaProduto(valor);
  const quantidadeCaracteres = consulta.replaceAll(' ', '').length;

  if (quantidadeCaracteres < MINIMO_CARACTERES_PRODUTO) {
    return { itens: [], total: 0 };
  }

  const palavrasBusca = consulta.split(' ');
  const encontrados = catalogo
    .map((produto) => ({
      produto,
      pontuacao: pontuarProduto(produto, consulta, palavrasBusca),
    }))
    .filter(({ pontuacao }) => Number.isFinite(pontuacao))
    .sort(
      (a, b) =>
        a.pontuacao - b.pontuacao ||
        a.produto.ordem - b.produto.ordem,
    );

  return {
    itens: encontrados.slice(0, Math.max(0, limite)).map(({ produto }) => produto.nome),
    total: encontrados.length,
  };
}
