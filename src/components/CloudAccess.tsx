import { useEffect, useSyncExternalStore } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { cloud } from '../services/cloudData';
import './CloudAccess.css';
export function CloudAccess() {
  const { logado, carregando, id, email } = useAuth();
  const state = useSyncExternalStore(cloud.subscribe, cloud.getSnapshot);
  useEffect(() => {
    if (logado) void cloud.connect(id, email).catch(() => {});
  }, [logado, id, email]);
  if (carregando)
    return (
      <p className="cloud-loading" role="status">
        Confirmando sua sessão…
      </p>
    );
  if (!logado) return <Navigate to="/conta?modo=login" replace />;
  if (state.owner !== id || ['idle', 'loading'].includes(state.status))
    return (
      <p className="cloud-loading" role="status">
        Carregando suas listas…
      </p>
    );
  if (state.status === 'error' && !state.dirty)
    return (
      <p className="cloud-loading">
        Não foi possível carregar os dados. Use “Tentar novamente” no aviso
        acima.
      </p>
    );
  return (
    <div
      className="cloud-view"
      key={`${id}-${state.epoch}`}
      inert={['error', 'conflict'].includes(state.status)}
    >
      <Outlet />
    </div>
  );
}
function baixarCopia() {
  const file = new Blob([JSON.stringify(cloud.getSnapshot().data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(file),
    link = document.createElement('a');
  link.href = url;
  link.download = 'liste-e-compre-copia.json';
  link.click();
  URL.revokeObjectURL(url);
}
export function CloudStatus() {
  const { logado, id } = useAuth();
  const state = useSyncExternalStore(cloud.subscribe, cloud.getSnapshot);
  useEffect(() => {
    const focus = () => {
      if (cloud.getSnapshot().status === 'ready') void cloud.load();
    };
    const leave = (event: BeforeUnloadEvent) => {
      if (cloud.getSnapshot().dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('focus', focus);
    window.addEventListener('beforeunload', leave);
    return () => {
      window.removeEventListener('focus', focus);
      window.removeEventListener('beforeunload', leave);
    };
  }, []);
  useEffect(() => {
    if (!logado && cloud.getSnapshot().owner) cloud.reset();
  }, [logado, id]);
  if (!logado || state.owner !== id || state.status === 'idle') return null;
  const failed = ['error', 'conflict'].includes(state.status);
  // A sincronização normal é silenciosa; o aviso aparece apenas quando há
  // uma falha ou um conflito que exige uma decisão do usuário.
  if (!failed) return null;
  return (
    <aside
      className="cloud-status cloud-failed"
      role="alert"
    >
      <p>
        {state.error}{' '}
        {state.dirty
          ? 'As alterações não sincronizadas permanecem apenas nesta aba.'
          : ''}
      </p>
      {state.status !== 'conflict' && (
        <button onClick={() => void cloud.retry().catch(() => {})}>
          Tentar novamente
        </button>
      )}
      {state.dirty && (
        <button onClick={baixarCopia}>Baixar cópia desta edição</button>
      )}
      <button
        onClick={() => {
          if (
            !state.dirty ||
            window.confirm(
              'Descartar a edição não sincronizada e carregar os dados da nuvem? Baixe uma cópia antes, se necessário.',
            )
          )
            void cloud.reload().catch(() => {});
        }}
      >
        Carregar dados da nuvem
      </button>
    </aside>
  );
}
