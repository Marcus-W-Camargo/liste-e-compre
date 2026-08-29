import {
  useCallback,
  useEffect,
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

  const iniciar = useCallback(
    (evento: TouchEvent) => {
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

  const terminar = useCallback(
    (evento: TouchEvent) => {
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

      suprimirCliqueAte.current = Date.now() + 600;
      navegar();
    },
    [aoDeslizarDireita, aoDeslizarEsquerda, cancelar],
  );

  useEffect(() => {
    // O gesto pertence à página inteira, não apenas ao <main>.
    // Assim também funciona no espaço vazio e sobre o rodapé.
    document.addEventListener('touchstart', iniciar, { passive: true });
    document.addEventListener('touchend', terminar, { passive: true });
    document.addEventListener('touchcancel', cancelar, { passive: true });

    return () => {
      document.removeEventListener('touchstart', iniciar);
      document.removeEventListener('touchend', terminar);
      document.removeEventListener('touchcancel', cancelar);
    };
  }, [cancelar, iniciar, terminar]);

  const aoIniciar: TouchEventHandler<HTMLElement> = useCallback(() => {
    // Os eventos de toque são tratados no document para incluir o rodapé.
  }, []);

  const aoTerminar: TouchEventHandler<HTMLElement> = useCallback(() => {
    // Mantido no retorno para não alterar a API usada pelas páginas.
  }, []);

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
