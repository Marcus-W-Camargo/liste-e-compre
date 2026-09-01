import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  cancelarExclusaoConta,
  confirmarExclusaoConta,
  solicitarExclusaoConta,
  type TentativaExclusaoConta,
} from '../utils/accountDeletion';
import './AccountDeletion.css';

export function AccountDeletion() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useAuth();
  const [destino, setDestino] = useState<HTMLElement | null>(null);
  const [aberto, setAberto] = useState(false);
  const [tentativa, setTentativa] = useState<TentativaExclusaoConta | null>(null);
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
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

  function resetarModal() {
    setTentativa(null);
    setCodigo('');
    setErro('');
    setMensagem('');
  }

  async function solicitar() {
    if (processando) return;

    setProcessando(true);
    setErro('');
    setMensagem('');
    try {
      const novaTentativa = await solicitarExclusaoConta();
      setTentativa(novaTentativa);
      setMensagem('Enviamos um código de 4 dígitos para o e-mail da sua conta.');
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível solicitar a exclusão da conta.',
      );
    } finally {
      setProcessando(false);
    }
  }

  async function confirmar() {
    if (!tentativa || !/^\d{4}$/.test(codigo) || processando) return;

    setProcessando(true);
    setErro('');
    try {
      await confirmarExclusaoConta(id, tentativa, codigo);
      resetarModal();
      setAberto(false);
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

  async function fechar() {
    const atual = tentativa;
    resetarModal();
    setAberto(false);
    if (atual) await cancelarExclusaoConta(atual);
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
            resetarModal();
            setAberto(true);
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
              Para confirmar esta alteração na conta, enviaremos um código de 4 dígitos
              para o e-mail da sua conta.
            </p>

            {tentativa && (
              <input
                value={codigo}
                onChange={(event) =>
                  setCodigo(event.target.value.replace(/\D/g, '').slice(0, 4))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="Código de confirmação da exclusão"
                placeholder="0000"
                autoFocus
              />
            )}

            {mensagem && (
              <p className="exclusao-conta-sucesso" role="status">
                {mensagem}
              </p>
            )}
            {erro && (
              <p className="exclusao-conta-erro" role="alert">
                {erro}
              </p>
            )}

            <div className="exclusao-conta-acoes">
              {!tentativa ? (
                <button
                  type="button"
                  className="exclusao-confirmar"
                  disabled={processando}
                  onClick={() => void solicitar()}
                >
                  {processando ? 'Enviando…' : 'Enviar código de confirmação'}
                </button>
              ) : (
                <button
                  type="button"
                  className="exclusao-confirmar"
                  disabled={!/^\d{4}$/.test(codigo) || processando}
                  onClick={() => void confirmar()}
                >
                  {processando ? 'Excluindo…' : 'Excluir permanentemente'}
                </button>
              )}
              <button
                type="button"
                disabled={processando}
                onClick={() => void fechar()}
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
