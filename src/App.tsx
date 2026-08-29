import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Lista } from './pages/Lista';
import { Conta } from './pages/Conta';
import { Compras } from './pages/Compras';
import { ComprasSessao } from './pages/ComprasSessao';
import { HistoricoCompras } from './pages/HistoricoCompras';
import { Perfil } from './pages/Perfil';
import { Ajuda } from './pages/Ajuda';
import { Header } from './components/Header';
import { CloudAccess, CloudStatus } from './components/CloudAccess';
import { useDesktopKeyboardNavigation } from './hooks/useDesktopKeyboardNavigation';
import './App.css';

function Rodape() {
  return (
    <footer className="rodape">
      <p>
        © 2026 Marcus Camargo. Todos os direitos reservados. Projeto
        desenvolvido para fins de estudo e portfólio.
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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/conta" element={<Conta />} />
            <Route element={<CloudAccess />}>
              <Route path="/lista" element={<Lista />} />
              <Route path="/compre" element={<Compras />} />
              <Route path="/compre/:listaId" element={<ComprasSessao />} />
              <Route path="/historico" element={<HistoricoCompras />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/ajuda" element={<Ajuda />} />
            </Route>
          </Routes>
        </div>

        <Rodape />
      </div>
    </BrowserRouter>
  );
}

export default App;
