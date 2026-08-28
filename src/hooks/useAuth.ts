import { useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  iniciarAuth,
  limparSessao,
  observarSessao,
  obterSessao,
} from '../utils/auth';
import { cloud } from '../services/cloudData';
export function useAuth() {
  const sessao = useSyncExternalStore(observarSessao, obterSessao);
  useEffect(() => {
    void iniciarAuth();
  }, []);
  const logout = useCallback(async () => {
    await cloud.flush();
    await limparSessao();
    cloud.reset();
  }, []);
  const atualizarSessao = useCallback(() => {
    void iniciarAuth();
  }, []);
  return { ...sessao, logout, atualizarSessao };
}
