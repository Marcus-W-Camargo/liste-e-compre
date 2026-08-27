import { useEffect, useSyncExternalStore } from 'react';
import { iniciarAuth, limparSessao, observarSessao, obterSessao } from '../utils/auth';
export function useAuth() {
  const sessao = useSyncExternalStore(observarSessao, obterSessao);
  useEffect(() => { void iniciarAuth(); }, []);
  return { ...sessao, logout: limparSessao };
}
