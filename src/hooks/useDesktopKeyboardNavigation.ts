import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { obterSessao } from '../utils/auth';
import {
  carregarHistoricoListas,
  carregarSessaoCompra,
} from '../utils/storage';
import { resolverDestinoRetornoHistorico } from '../utils/purchaseNavigation';

const CONSULTA_DESKTOP = '(min-width: 701px)';
const CAMPOS_EDITAVEIS =
  'input, textarea, select, [contenteditable="true"], [role="dialog"]';

export function useDesktopKeyboardNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function navegar(evento: KeyboardEvent) {
      if (!window.matchMedia(CONSULTA_DESKTOP).matches) return;
      if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;

      const alvo = evento.target;
      if (alvo instanceof Element && alvo.closest(CAMPOS_EDITAVEIS)) return;

      const tecla = evento.key.toLowerCase();
      const esquerda = tecla === 'a' || tecla === 'arrowleft';
      const direita = tecla === 'd' || tecla === 'arrowright';
      if (!esquerda && !direita) return;

      const { pathname } = location;
      let destino: string | null = null;
      let state: { retornoCompras?: string } | undefined;

      if (pathname === '/lista' && direita) {
        destino = '/compre';
      } else if (pathname === '/compre') {
        if (esquerda) destino = '/lista';
        if (direita) {
          destino = '/historico';
          state = { retornoCompras: '/compre' };
        }
      } else if (pathname.startsWith('/compre/')) {
        if (esquerda) destino = '/compre';
        if (direita) {
          destino = '/historico';
          state = { retornoCompras: pathname };
        }
      } else if (pathname === '/historico' && esquerda) {
        const email = obterSessao().email;
        const retornoSolicitado = (location.state as
          | { retornoCompras?: unknown }
          | null)?.retornoCompras;
        destino = resolverDestinoRetornoHistorico(
          retornoSolicitado,
          carregarSessaoCompra(email),
          carregarHistoricoListas(email).map((lista) => lista.id),
        );
      }

      if (!destino) return;
      evento.preventDefault();
      navigate(destino, state ? { state } : undefined);
    }

    document.addEventListener('keydown', navegar);
    return () => document.removeEventListener('keydown', navegar);
  }, [location, navigate]);
}
