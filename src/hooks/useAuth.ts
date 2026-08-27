import { useState, useEffect, useCallback } from 'react';
import { obterSessao, limparSessao, type SessaoUsuario } from '../utils/auth';

export function useAuth() {
  const [sessao, setSessao] = useState<SessaoUsuario>(() => obterSessao());

  // Revalida ao focar a janela (útil se outra aba fez logout)
  useEffect(() => {
    const revalidar = () => setSessao(obterSessao());
    window.addEventListener('sessao-alterada', revalidar);
    window.addEventListener('focus', revalidar);
    window.addEventListener('storage', revalidar);
    return () => {
      window.removeEventListener('sessao-alterada', revalidar);
      window.removeEventListener('focus', revalidar);
      window.removeEventListener('storage', revalidar);
    };
  }, []);

  const logout = useCallback(() => {
    limparSessao();
    setSessao({ logado: false, nome: '', email: '' });
  }, []);

  const atualizarSessao = useCallback(() => {
    setSessao(obterSessao());
  }, []);

  return {
    logado: sessao.logado,
    nome: sessao.nome,
    logout,
    atualizarSessao,
  };
}
