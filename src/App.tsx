import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Header } from './components/Header';
import { AccountDeletion } from './components/AccountDeletion';
import { CloudAccess, CloudStatus } from './components/CloudAccess';
import { useDesktopKeyboardNavigation } from './hooks/useDesktopKeyboardNavigation';
import './App.css';

const Conta = lazy(() => import('./pages/Conta').then((modulo) => ({ default: modulo.Conta })));
const Privacidade = lazy(() => import('./pages/Privacidade').then((modulo) => ({ default: modulo.Privacidade })));
const Lista = lazy(() => import('./pages/Lista').then((modulo) => ({ default: modulo.Lista })));
const Compras = lazy(() => import('./pages/Compras').then((modulo) => ({ default: modulo.Compras })));
const ComprasSessao = lazy(() => import('./pages/ComprasSessao').then((modulo) => ({ default: modulo.ComprasSessao })));
const HistoricoCompras = lazy(() => import('./pages/HistoricoCompras').then((modulo) => ({ default: modulo.HistoricoCompras })));
const Perfil = lazy(() => import('./pages/Perfil').then((modulo) => ({ default: modulo.Perfil })));
const PaginaAjuda = lazy(() => import('./pages/AjudaRoute').then((modulo) => ({ default: modulo.PaginaAjuda })));
const ConfirmarExclusaoConta = lazy(() => import('./pages/ConfirmarExclusaoConta').then((modulo) => ({ default: modulo.ConfirmarExclusaoConta })));

function Rodape() {
  return (
    <footer className="rodape">
      <p>
        © 2026 Marcus Camargo. Todos os direitos reservados. Projeto
        desenvolvido para fins de estudo e portfólio.{' '}
        <Link to="/privacidade">Política de Privacidade</Link>
      </p>
    </footer>
  );
}

function NavegacaoDesktop() {
  useDesktopKeyboardNavigation();
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <NavegacaoDesktop />
      <div className="app-layout">
        <div className="app-conteudo">
          <Header />
          <CloudStatus />
          <AccountDeletion />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/conta" element={<Conta />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/confirmar-exclusao" element={<ConfirmarExclusaoConta />} />
              <Route element={<CloudAccess />}>
                <Route path="/lista" element={<Lista />} />
                <Route path="/compre" element={<Compras />} />
                <Route path="/compre/:listaId" element={<ComprasSessao />} />
                <Route path="/historico" element={<HistoricoCompras />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/ajuda" element={<PaginaAjuda />} />
              </Route>
            </Routes>
          </Suspense>
        </div>

        <Rodape />
      </div>
    </BrowserRouter>
  );
}

export default App;
