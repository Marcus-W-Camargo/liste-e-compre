import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSwipeNavigation } from '../src/hooks/useSwipeNavigation';

function Superficie({
  esquerda,
  direita,
}: {
  esquerda: () => void;
  direita: () => void;
}) {
  const gestos = useSwipeNavigation({
    aoDeslizarEsquerda: esquerda,
    aoDeslizarDireita: direita,
  });

  return (
    <main data-testid="superficie" {...gestos}>
      <input aria-label="Campo protegido" />
    </main>
  );
}

function arrastar(
  elemento: Element,
  inicio: { x: number; y: number },
  fim: { x: number; y: number },
) {
  fireEvent.touchStart(elemento, {
    touches: [{ clientX: inicio.x, clientY: inicio.y }],
  });
  fireEvent.touchEnd(elemento, {
    changedTouches: [{ clientX: fim.x, clientY: fim.y }],
  });
}

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('navegação mobile por deslize', () => {
  it('reconhece os gestos horizontais para esquerda e direita', () => {
    const esquerda = vi.fn();
    const direita = vi.fn();
    render(<Superficie esquerda={esquerda} direita={direita} />);
    const superficie = screen.getByTestId('superficie');

    arrastar(superficie, { x: 260, y: 100 }, { x: 130, y: 108 });
    arrastar(superficie, { x: 100, y: 100 }, { x: 230, y: 92 });

    expect(esquerda).toHaveBeenCalledOnce();
    expect(direita).toHaveBeenCalledOnce();
  });

  it('ignora rolagem vertical e movimentos horizontais curtos', () => {
    const esquerda = vi.fn();
    const direita = vi.fn();
    render(<Superficie esquerda={esquerda} direita={direita} />);
    const superficie = screen.getByTestId('superficie');

    arrastar(superficie, { x: 200, y: 100 }, { x: 100, y: 260 });
    arrastar(superficie, { x: 200, y: 100 }, { x: 150, y: 102 });

    expect(esquerda).not.toHaveBeenCalled();
    expect(direita).not.toHaveBeenCalled();
  });

  it('não captura gestos iniciados em campos de formulário', () => {
    const esquerda = vi.fn();
    const direita = vi.fn();
    render(<Superficie esquerda={esquerda} direita={direita} />);

    arrastar(
      screen.getByLabelText('Campo protegido'),
      { x: 260, y: 100 },
      { x: 100, y: 102 },
    );

    expect(esquerda).not.toHaveBeenCalled();
    expect(direita).not.toHaveBeenCalled();
  });
});
