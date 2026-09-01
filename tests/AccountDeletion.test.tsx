import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccountDeletion } from '../src/components/AccountDeletion';

vi.mock('../src/utils/accountDeletion', () => ({
  solicitarExclusaoConta: vi.fn(),
}));

afterEach(() => {
  cleanup();
  document.querySelector('.card-perfil')?.remove();
  vi.clearAllMocks();
});

describe('exclusão de conta com perfil lazy', () => {
  it('aguarda o card do perfil aparecer antes de montar a ação de exclusão', async () => {
    render(
      <MemoryRouter initialEntries={['/perfil']}>
        <AccountDeletion />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: 'Excluir conta' })).toBeNull();

    const card = document.createElement('section');
    card.className = 'card-perfil';
    document.body.appendChild(card);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Excluir conta' })).toBeTruthy();
    });

    expect(card.querySelector('.exclusao-conta-ponto')).toBeTruthy();
  });
});
