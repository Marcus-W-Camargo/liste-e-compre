import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormularioItem } from '../src/components/FormularioItem';
import { ListaItens } from '../src/components/ListaItens';
import { CATEGORIAS } from '../src/types';

afterEach(cleanup);

const categoriasEsperadas = [
  '🍞 Mercearia',
  '🍎 Hortifrúti',
  '🥩 Açougue',
  '🥤 Bebidas',
  '🥛 Laticínios',
  '🧹 Limpeza',
  '🧼 Higiene',
  '📦 Outros',
];

describe('categorias do catálogo', () => {
  it('mantém Bebidas abaixo de Açougue e Outros na última posição', () => {
    expect(CATEGORIAS.map((categoria) => categoria.label)).toEqual(
      categoriasEsperadas,
    );
  });

  it('oferece as novas categorias na separação da lista', () => {
    render(
      <ListaItens
        itens={[]}
        filtro="Geral"
        onFiltroChange={vi.fn()}
        onAtualizar={vi.fn()}
        onRemover={vi.fn()}
        onSalvarLista={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '📋 Geral (Todos)' }));

    const opcoes = within(
      screen.getByRole('listbox', { name: 'Filtrar por categoria' }),
    ).getAllByRole('option');

    expect(opcoes.map((opcao) => opcao.textContent)).toEqual([
      '📋 Geral (Todos)',
      ...categoriasEsperadas,
    ]);
  });

  it('permite selecionar Bebidas e Outros ao criar um item', () => {
    render(<FormularioItem onAdicionar={vi.fn()} />);

    const seletorCategoria = screen.getByRole('button', { name: 'Categoria' });

    fireEvent.click(seletorCategoria);
    fireEvent.click(screen.getByRole('button', { name: '🥤 Bebidas' }));
    expect(seletorCategoria.textContent).toContain('🥤 Bebidas');

    fireEvent.click(seletorCategoria);
    fireEvent.click(screen.getByRole('button', { name: '📦 Outros' }));
    expect(seletorCategoria.textContent).toContain('📦 Outros');
  });
});
