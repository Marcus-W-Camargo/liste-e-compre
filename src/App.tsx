import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Lista } from './pages/Lista';
import { Conta } from './pages/Conta';
import { Compras } from './pages/Compras';
import { ComprasSessao } from './pages/ComprasSessao';
import { HistoricoCompras } from './pages/HistoricoCompras';
import { Header } from './components/Header';
import { CloudAccess, CloudStatus } from './components/CloudAccess';
import { useAuth } from './hooks/useAuth';
import { useDesktopKeyboardNavigation } from './hooks/useDesktopKeyboardNavigation';
import './App.css';

function Placeholder({ titulo }: { titulo: string }) {
  return (
    <div className="pagina-placeholder">
      <h1>{titulo}</h1>
      <p>Página em migração — em breve.</p>
      <a href="/">← Voltar para a Home</a>
    </div>
  );
}

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

function Perfil() {
  const { nome, email } = useAuth();
  return (
    <main className="pagina-placeholder">
      <h1>Minha conta</h1>
      <p>{nome}</p>
      <p>{email}</p>
      <p>
        Suas listas são vinculadas a esta conta e sincronizadas com a nuvem.
      </p>
    </main>
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
              <Route path="/ajuda" element={<Placeholder titulo="Ajuda" />} />
            </Route>
          </Routes>
        </div>

        <Rodape />
      </div>
    </BrowserRouter>
  );
}

export default App;
