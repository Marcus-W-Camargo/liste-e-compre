import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Lista } from './pages/Lista';
import { Conta } from './pages/Conta';
import { Compras } from './pages/Compras';
import { ComprasSessao } from './pages/ComprasSessao';
import { HistoricoCompras } from './pages/HistoricoCompras';
import { Header } from './components/Header';
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

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <div className="app-conteudo">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lista" element={<Lista />} />
            <Route path="/conta" element={<Conta />} />
            <Route path="/compre" element={<Compras />} />
            <Route
              path="/compre/:listaId"
              element={<ComprasSessao />}
            />
            <Route
              path="/historico"
              element={<HistoricoCompras />}
            />
            <Route
              path="/perfil"
              element={<Placeholder titulo="Minha conta" />}
            />
            <Route path="/ajuda" element={<Placeholder titulo="Ajuda" />} />
          </Routes>
        </div>

        <Rodape />
      </div>
    </BrowserRouter>
  );
}

export default App;
