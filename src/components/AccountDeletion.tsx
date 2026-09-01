import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { solicitarExclusaoConta } from '../utils/accountDeletion';
import './AccountDeletion.css';

export function AccountDeletion() {
  const location = useLocation();
  const [destino, setDestino] = useState<HTMLElement | null>(null);
  const [aberto, setAberto] = useState(false);
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

  async function solicitar() {
    if (processando) return;

    setProcessando(true);
    setErro('');
    setMensagem('');
    try {
      await solicitarExclusaoConta();
      setMensagem(
        'Enviamos um link de confirmação para o e-mail da sua conta. Abra-o neste mesmo dispositivo e conexão.',
      );
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
            setErro('');
            setMensagem('');
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
              A exclusão só será concluída após você abrir o link enviado ao
              e-mail da sua conta usando este mesmo dispositivo e conexão.
            </p>

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
              <button
                type="button"
                className="exclusao-confirmar"
                disabled={processando || Boolean(mensagem)}
                onClick={() => void solicitar()}
              >
                {processando ? 'Enviando…' : 'Enviar link de confirmação'}
              </button>
              <button
                type="button"
                disabled={processando}
                onClick={() => setAberto(false)}
              >
                {mensagem ? 'Fechar' : 'Cancelar'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>,
    destino,
  );
}
