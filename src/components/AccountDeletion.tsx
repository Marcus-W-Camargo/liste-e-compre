import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { excluirConta } from '../utils/accountDeletion';
import './AccountDeletion.css';

export function AccountDeletion() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useAuth();
  const [destino, setDestino] = useState<HTMLElement | null>(null);
  const [aberto, setAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    setDestino(null);

    if (location.pathname !== '/perfil') return;

    let ponto: HTMLDivElement | null = null;
    let observador: MutationObserver | null = null;

    function anexarAoPerfil() {
      if (ponto) return true;

      const card = document.querySelector('.card-perfil');
      if (!(card instanceof HTMLElement)) return false;

      ponto = document.createElement('div');
      ponto.className = 'exclusao-conta-ponto';
      card.appendChild(ponto);
      setDestino(ponto);
      return true;
    }

    if (!anexarAoPerfil()) {
      observador = new MutationObserver(() => {
        if (anexarAoPerfil()) observador?.disconnect();
      });
      observador.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observador?.disconnect();
      ponto?.remove();
    };
  }, [location.pathname]);

  async function confirmar() {
    if (confirmacao !== 'EXCLUIR' || processando) return;

    setProcessando(true);
    setErro('');
    try {
      await excluirConta(id);
      navigate('/conta', { replace: true });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir a conta.',
      );
      setProcessando(false);
    }
  }

  if (!destino) return null;

  return createPortal(
    <>
      <section className="zona-perigo-conta">
        <div>
          <strong>Excluir conta</strong>
          <p>Remove permanentemente sua conta, dados sincronizados e foto de perfil.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAberto(true);
            setConfirmacao('');
            setErro('');
          }}
        >
          Excluir conta
        </button>
      </section>

      {aberto && (
        <div className="exclusao-conta-overlay" role="presentation">
          <section
            className="exclusao-conta-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-excluir-conta"
          >
            <h2 id="titulo-excluir-conta">Excluir conta permanentemente?</h2>
            <p>
              Esta ação não pode ser desfeita. Digite <strong>EXCLUIR</strong>{' '}
              para confirmar.
            </p>
            <input
              value={confirmacao}
              onChange={(event) =>
                setConfirmacao(event.target.value.toUpperCase())
              }
              autoComplete="off"
              aria-label="Digite EXCLUIR para confirmar"
              autoFocus
            />
            {erro && (
              <p className="exclusao-conta-erro" role="alert">
                {erro}
              </p>
            )}
            <div className="exclusao-conta-acoes">
              <button
                type="button"
                className="exclusao-confirmar"
                disabled={confirmacao !== 'EXCLUIR' || processando}
                onClick={() => void confirmar()}
              >
                {processando ? 'Excluindo…' : 'Excluir permanentemente'}
              </button>
              <button
                type="button"
                disabled={processando}
                onClick={() => setAberto(false)}
              >
                Cancelar
              </button>
            </div>
          </section>
        </div>
      )}
    </>,
    destino,
  );
}
