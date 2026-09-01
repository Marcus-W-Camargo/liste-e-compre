import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  confirmarExclusaoConta,
  validarExclusaoConta,
} from '../utils/accountDeletion';
import './ConfirmarExclusaoConta.css';

type Estado = 'validando' | 'pronto' | 'excluindo' | 'sucesso' | 'erro';

export function ConfirmarExclusaoConta() {
  const [searchParams] = useSearchParams();
  const { id } = useAuth();
  const [estado, setEstado] = useState<Estado>('validando');

  const token = searchParams.get('token') ?? '';

  useEffect(() => {
    if (!token) {
      setEstado('erro');
      return;
    }

    let ativo = true;
    void (async () => {
      try {
        await validarExclusaoConta(token);
        if (ativo) setEstado('pronto');
      } catch {
        if (ativo) setEstado('erro');
      }
    })();

    return () => {
      ativo = false;
    };
  }, [token]);

  async function concluirExclusao() {
    if (estado !== 'pronto') return;

    setEstado('excluindo');
    try {
      await confirmarExclusaoConta(id, token);
      setEstado('sucesso');
    } catch {
      setEstado('erro');
    }
  }

  return (
    <main className="confirmacao-exclusao-pagina">
      <section className="confirmacao-exclusao-card" aria-live="polite">
        {estado === 'validando' && <p>Validando solicitação de exclusão…</p>}
        {estado === 'pronto' && (
          <>
            <p>Solicitação validada neste dispositivo e conexão.</p>
            <button
              type="button"
              className="confirmacao-exclusao-botao"
              onClick={() => void concluirExclusao()}
            >
              Confirmar exclusão da conta
            </button>
          </>
        )}
        {estado === 'excluindo' && <p>Concluindo exclusão da conta…</p>}
        {estado === 'sucesso' && (
          <p>
            Deletação de conta concluída. Pode fechar a página e voltar ao navegador.
          </p>
        )}
        {estado === 'erro' && (
          <p>
            A deletação de conta não foi bem-sucedida. Por favor entre no link com o
            mesmo dispositivo usado na solicitação.
          </p>
        )}
      </section>
    </main>
  );
}
