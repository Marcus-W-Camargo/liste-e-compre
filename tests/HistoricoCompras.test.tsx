import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { CompraFinalizada } from '../src/types';
import { HistoricoCompras } from '../src/pages/HistoricoCompras';

const storage = vi.hoisted(() => ({
  carregarComprasFinalizadas: vi.fn(),
  carregarEdicaoAtual: vi.fn(),
  carregarHistoricoListas: vi.fn(),
  carregarListaAtual: vi.fn(),
  carregarSessaoCompra: vi.fn(),
  salvarListaAtual: vi.fn(),
}));

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({ logado: true }),
}));

vi.mock('../src/hooks/useSwipeNavigation', () => ({
  useSwipeNavigation: () => ({}),
}));

vi.mock('../src/utils/auth', () => ({
  obterSessao: () => ({ email: 'usuario@teste.com' }),
}));

vi.mock('../src/utils/storage', () => storage);

const compra: CompraFinalizada = {
  id: 'compra-1',
  listaId: 'lista-1',
  nomeLista: 'Mercado semanal',
  dataInicio: '2026-08-28T10:00:00.000Z',
  dataFim: '2026-08-28T11:00:00.000Z',
  valorTotal: 31,
  porcentagemFinal: 100,
  gastosAdicionais: 5,
  itens: [
    {
      id: 'item-2',
      nome: 'Sabonete',
      categoria: '🧼 Higiene',
      quantidade: 2,
      tipo: 'un',
      precoUnitario: 3,
      pego: true,
      origem: 'planejado',
    },
    {
      id: 'item-1',
      nome: 'Arroz',
      categoria: '🍞 Mercearia',
      quantidade: 1,
      tipo: 'un',
      precoUnitario: 20,
      pego: true,
      origem: 'planejado',
    },
    {
      id: 'item-3',
      nome: 'Sacola',
      categoria: '📦 Outros',
      quantidade: 1,
      tipo: 'un',
      precoUnitario: 5,
      pego: true,
      origem: 'extra',
    },
  ],
};

function abrirHistorico() {
  return render(
    <MemoryRouter initialEntries={['/historico']}>
      <Routes>
        <Route path="/historico" element={<HistoricoCompras />} />
        <Route path="/lista" element={<h1>Página de criação</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  storage.carregarComprasFinalizadas.mockReturnValue([compra]);
  storage.carregarHistoricoListas.mockReturnValue([]);
  storage.carregarSessaoCompra.mockReturnValue(null);
  storage.carregarListaAtual.mockReturnValue([]);
  storage.carregarEdicaoAtual.mockReturnValue(null);
});

afterEach(cleanup);

describe('página de histórico', () => {
  it('abre as ações, mostra itens por categoria e refaz a compra na criação de lista', () => {
    abrirHistorico();

    expect(screen.getByText(/Extras:/).textContent).toContain('Extras:');
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Abrir opções da compra Mercado semanal',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Ver itens da compra/ }),
    );

    expect(
      screen.getAllByRole('heading', { level: 3 }).map((item) => item.textContent),
    ).toEqual(['🍞 Mercearia', '🧼 Higiene', '📦 Outros']);
    expect(screen.getByText('Sacola').parentElement?.textContent).toContain(
      'Extra',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Voltar às opções' }));
    fireEvent.click(
      screen.getByRole('button', { name: /Refazer a mesma compra/ }),
    );

    expect(storage.salvarListaAtual).toHaveBeenCalledWith(
      'usuario@teste.com',
      expect.arrayContaining([
        expect.objectContaining({ nome: 'Arroz', comprado: false }),
        expect.objectContaining({ nome: 'Sabonete', comprado: false }),
        expect.objectContaining({ nome: 'Sacola', comprado: false }),
      ]),
      null,
    );
    expect(screen.getByRole('heading', { name: 'Página de criação' })).toBeTruthy();
  });

  it('pede confirmação antes de substituir uma lista que já está em criação', () => {
    storage.carregarListaAtual.mockReturnValue([
      {
        id: 'rascunho',
        nome: 'Leite',
        categoria: '🥛 Laticínios',
        quantidade: 1,
        tipo: 'un',
      },
    ]);
    abrirHistorico();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Abrir opções da compra Mercado semanal',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Refazer a mesma compra/ }),
    );

    expect(
      screen.getByRole('heading', { name: 'Substituir lista em criação?' }),
    ).toBeTruthy();
    expect(storage.salvarListaAtual).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
