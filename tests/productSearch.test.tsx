import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { AutocompleteProduto } from '../src/components/AutocompleteProduto';
import { buscarProdutos } from '../src/utils/productSearch';

afterEach(cleanup);

function CampoTeste() {
  const [valor, setValor] = useState('');
  return (
    <AutocompleteProduto
      ariaLabel="Produto"
      value={valor}
      onValueChange={setValor}
    />
  );
}

describe('busca de produtos', () => {
  it('ignora acentos e diferencia termos progressivamente', () => {
    const feijoes = buscarProdutos('feijao', 100).itens;
    const feijoesComC = buscarProdutos('Feijão C', 100).itens;

    expect(feijoes).toContain('Feijão Preto');
    expect(feijoesComC).toContain('Feijão Carioca');
    expect(feijoesComC).toContain('Feijão Cavalo');
    expect(feijoesComC).toContain('Feijão de Corda');
    expect(feijoesComC).not.toContain('Feijão Preto');
    expect(feijoesComC.length).toBeLessThan(feijoes.length);
  });

  it('não pesquisa antes de três caracteres', () => {
    expect(buscarProdutos('fe').itens).toEqual([]);
    expect(buscarProdutos('fei').itens.length).toBeGreaterThan(0);
  });
});

describe('autocomplete de produtos', () => {
  it('abre após três caracteres e seleciona uma sugestão por clique', () => {
    render(<CampoTeste />);
    const campo = screen.getByRole('combobox', { name: 'Produto' });

    fireEvent.change(campo, { target: { value: 'fe' } });
    expect(screen.queryByRole('listbox')).toBeNull();

    fireEvent.change(campo, { target: { value: 'fei' } });
    expect(screen.getByRole('listbox', { name: 'Sugestões de produtos' })).toBeTruthy();

    fireEvent.click(screen.getByRole('option', { name: 'Feijão Carioca' }));
    expect((campo as HTMLInputElement).value).toBe('Feijão Carioca');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('permite navegar e selecionar com o teclado', () => {
    render(<CampoTeste />);
    const campo = screen.getByRole('combobox', { name: 'Produto' });

    fireEvent.change(campo, { target: { value: 'Feijão C' } });
    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    expect(screen.getByRole('option', { name: 'Feijão Carioca' }).getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(campo, { key: 'Enter' });
    expect((campo as HTMLInputElement).value).toBe('Feijão Carioca');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('mantém nomes personalizados quando não existem sugestões', () => {
    render(<CampoTeste />);
    const campo = screen.getByRole('combobox', { name: 'Produto' });

    fireEvent.change(campo, { target: { value: 'Produto totalmente personalizado' } });
    expect(screen.getByText('Nenhuma sugestão. Você ainda pode usar esse nome.')).toBeTruthy();
    expect((campo as HTMLInputElement).value).toBe('Produto totalmente personalizado');
  });
});
