import {
  useCallback,
  useRef,
  type MouseEventHandler,
  type TouchEventHandler,
} from 'react';

type OpcoesDeslize = {
  aoDeslizarEsquerda?: () => void;
  aoDeslizarDireita?: () => void;
  larguraMaxima?: number;
};

type InicioDeslize = {
  x: number;
  y: number;
};

const DISTANCIA_MINIMA = 72;
const PREDOMINANCIA_HORIZONTAL = 1.35;

export function useSwipeNavigation({
  aoDeslizarEsquerda,
  aoDeslizarDireita,
  larguraMaxima = 700,
}: OpcoesDeslize) {
  const inicio = useRef<InicioDeslize | null>(null);
  const suprimirCliqueAte = useRef(0);

  const cancelar = useCallback(() => {
    inicio.current = null;
  }, []);

  const aoIniciar: TouchEventHandler<HTMLElement> = useCallback(
    (evento) => {
      if (
        evento.touches.length !== 1 ||
        !window.matchMedia(`(max-width: ${larguraMaxima}px)`).matches
      ) {
        cancelar();
        return;
      }

      const alvo = evento.target;
      if (
        alvo instanceof Element &&
        alvo.closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"]',
        )
      ) {
        cancelar();
        return;
      }

      const toque = evento.touches[0];
      inicio.current = { x: toque.clientX, y: toque.clientY };
    },
    [cancelar, larguraMaxima],
  );

  const aoTerminar: TouchEventHandler<HTMLElement> = useCallback(
    (evento) => {
      const origem = inicio.current;
      cancelar();
      if (!origem || evento.changedTouches.length !== 1) return;

      const toque = evento.changedTouches[0];
      const deslocamentoX = toque.clientX - origem.x;
      const deslocamentoY = toque.clientY - origem.y;

      if (
        Math.abs(deslocamentoX) < DISTANCIA_MINIMA ||
        Math.abs(deslocamentoX) <
          Math.abs(deslocamentoY) * PREDOMINANCIA_HORIZONTAL
      )
        return;

      const navegar =
        deslocamentoX < 0 ? aoDeslizarEsquerda : aoDeslizarDireita;
      if (!navegar) return;

      // Evita que o clique sintético do toque também ative o card ou botão
      // sobre o qual o usuário iniciou a navegação.
      suprimirCliqueAte.current = Date.now() + 600;
      navegar();
    },
    [aoDeslizarDireita, aoDeslizarEsquerda, cancelar],
  );

  const aoClicar: MouseEventHandler<HTMLElement> = useCallback((evento) => {
    if (Date.now() > suprimirCliqueAte.current) return;

    suprimirCliqueAte.current = 0;
    evento.preventDefault();
    evento.stopPropagation();
  }, []);

  return {
    onTouchStart: aoIniciar,
    onTouchEnd: aoTerminar,
    onTouchCancel: cancelar,
    onClickCapture: aoClicar,
  };
}
