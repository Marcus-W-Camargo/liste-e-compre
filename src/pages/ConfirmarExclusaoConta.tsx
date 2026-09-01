import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { confirmarExclusaoConta } from '../utils/accountDeletion';
import './ConfirmarExclusaoConta.css';

export function ConfirmarExclusaoConta() {
  const [searchParams] = useSearchParams();
  const { id } = useAuth();
  const [estado, setEstado] = useState<'processando' | 'sucesso' | 'erro'>('processando');

  useEffect(() => {
    const token = searchParams.get('token') ?? '';
    if (!token) {
      setEstado('erro');
      return;
    }

    let ativo = true;
    void (async () => {
      try {
        await confirmarExclusaoConta(id, token);
        if (ativo) setEstado('sucesso');
      } catch {
        if (ativo) setEstado('erro');
      }
    })();

    return () => {
      ativo = false;
    };
  }, [id, searchParams]);

  return (
    <main className="confirmacao-exclusao-pagina">
      <section className="confirmacao-exclusao-card" aria-live="polite">
        {estado === 'processando' && <p>Validando solicitação de exclusão…</p>}
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
