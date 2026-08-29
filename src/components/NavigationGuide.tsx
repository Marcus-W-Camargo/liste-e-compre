import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useLocation } from 'react-router-dom';
import {
  deveMostrarGuiaNavegacao,
  marcarGuiaNavegacaoComoVisto,
  type ModoGuiaNavegacao,
} from '../utils/userNotices';
import './NavigationGuide.css';

const consultaMobile = '(max-width: 700px)';

function modoAtual(): ModoGuiaNavegacao {
  return window.matchMedia(consultaMobile).matches ? 'mobile' : 'desktop';
}

function rotaComNavegacao(pathname: string) {
  return (
    pathname === '/lista' ||
    pathname === '/compre' ||
    pathname.startsWith('/compre/') ||
    pathname === '/historico'
  );
}

export function NavigationGuide({ usuarioId }: { usuarioId: string }) {
  const location = useLocation();
  const [modo, setModo] = useState<ModoGuiaNavegacao>(modoAtual);
  const [guiaFechado, setGuiaFechado] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia(consultaMobile);
    const atualizarModo = () => setModo(media.matches ? 'mobile' : 'desktop');
    media.addEventListener('change', atualizarModo);
    return () => media.removeEventListener('change', atualizarModo);
  }, []);

  const guiaAtual = `${usuarioId}:${modo}`;
  const visivel =
    rotaComNavegacao(location.pathname) &&
    guiaFechado !== guiaAtual &&
    deveMostrarGuiaNavegacao(usuarioId, modo);

  useEffect(() => {
    if (visivel) overlayRef.current?.focus();
  }, [visivel]);

  function fechar() {
    marcarGuiaNavegacaoComoVisto(usuarioId, modo);
    setGuiaFechado(guiaAtual);
  }

  function fecharPeloTeclado(event: KeyboardEvent<HTMLDivElement>) {
    if (['Enter', ' ', 'Escape'].includes(event.key)) {
      event.preventDefault();
      fechar();
    }
  }

  if (!visivel) return null;

  const mobile = modo === 'mobile';

  return (
    <div
      ref={overlayRef}
      className="guia-navegacao"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-guia-navegacao"
      aria-describedby="texto-guia-navegacao"
      tabIndex={0}
      onClick={fechar}
      onKeyDown={fecharPeloTeclado}
    >
      <div className="guia-navegacao__card">
        {mobile ? (
          <div className="guia-navegacao__setas" aria-hidden="true">
            <span>←</span><i>☝️</i><span>→</span>
          </div>
        ) : (
          <div className="guia-navegacao__teclas" aria-hidden="true">
            <kbd>A</kbd><span>←</span><span className="guia-navegacao__separador">•</span><span>→</span><kbd>D</kbd>
          </div>
        )}
        <h2 id="titulo-guia-navegacao">
          {mobile ? 'Navegue deslizando' : 'Navegue pelo teclado'}
        </h2>
        <p id="texto-guia-navegacao">
          {mobile
            ? 'Arraste a tela para a esquerda ou para a direita para acessar Listas, Compras e Histórico.'
            : 'Use A para navegar à esquerda e D para navegar à direita entre Listas, Compras e Histórico.'}
        </p>
        <small>
          {mobile
            ? 'Toque em qualquer lugar para continuar'
            : 'Clique em qualquer lugar para continuar'}
        </small>
      </div>
    </div>
  );
}
