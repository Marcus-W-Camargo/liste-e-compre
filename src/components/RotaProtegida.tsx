import { Fragment } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
export function RotaProtegida() {
  const { carregando, logado, id } = useAuth();
  if (carregando) return <p role="status">Verificando sua sessão...</p>;
  if (!logado) return <Navigate to="/conta?modo=login" replace />;
  // Trocar a conta desmonta o estado local das telas da conta anterior.
  return <Fragment key={id}><Outlet /></Fragment>;
}
