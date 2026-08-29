import {
  CATEGORIAS,
  type CompraFinalizada,
  type Item,
  type ItemCompra,
} from '../types';

export interface GrupoItensHistorico {
  categoria: (typeof CATEGORIAS)[number];
  itens: ItemCompra[];
}

function categoriaDoItem(categoria: string) {
  return (
    CATEGORIAS.find(
      (item) =>
        categoria === item.label ||
        categoria === item.value ||
        categoria.includes(item.value),
    ) ?? CATEGORIAS[CATEGORIAS.length - 1]
  );
}

export function agruparItensDaCompra(
  itens: ItemCompra[],
): GrupoItensHistorico[] {
  return CATEGORIAS.map((categoria) => ({
    categoria,
    itens: itens.filter(
      (item) => categoriaDoItem(item.categoria).value === categoria.value,
    ),
  })).filter((grupo) => grupo.itens.length > 0);
}

export function criarItensParaRefazerCompra(
  compra: CompraFinalizada,
  criarId: () => string = () => crypto.randomUUID(),
): Item[] {
  return compra.itens.map((item) => ({
    id: criarId(),
    nome: item.nome,
    quantidade: item.quantidade,
    tipo: item.tipo,
    categoria: categoriaDoItem(item.categoria).label,
    comprado: false,
  }));
}
