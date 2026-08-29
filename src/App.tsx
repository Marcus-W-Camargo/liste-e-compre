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
    <main className="pagina-perfil">
      <section className="card-perfil" aria-labelledby="titulo-perfil">
        <header className="cabecalho-perfil">
          <div className="avatar-perfil" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M12 12.25a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2.1c-4.24 0-7.75 2.18-7.75 4.82V21h15.5v-1.83c0-2.64-3.51-4.82-7.75-4.82Z" />
            </svg>
            <span className="indicador-foto-perfil">
              <svg viewBox="0 0 24 24">
                <path d="M8.2 6.5 9.4 4.8h5.2l1.2 1.7H19A2 2 0 0 1 21 8.5v8A2 2 0 0 1 19 18.5H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3.2ZM12 16a3.75 3.75 0 1 0 0-7.5A3.75 3.75 0 0 0 12 16Z" />
              </svg>
            </span>
          </div>

          <div className="apresentacao-perfil">
            <span>Minha conta</span>
            <h1 id="titulo-perfil">Seu perfil</h1>
            <p>Estas são as informações vinculadas à sua conta.</p>
          </div>
        </header>

        <div className="dados-perfil">
          <div className="campo-informacao-perfil">
            <span className="icone-informacao-perfil" aria-hidden="true">👤</span>
            <div>
              <span className="rotulo-informacao-perfil">Nome</span>
              <strong>{nome}</strong>
            </div>
          </div>

          <div className="campo-informacao-perfil">
            <span className="icone-informacao-perfil" aria-hidden="true">✉️</span>
            <div>
              <span className="rotulo-informacao-perfil">E-mail</span>
              <strong>{email}</strong>
            </div>
          </div>
        </div>

        <p className="aviso-sincronizacao-perfil">
          <span aria-hidden="true">☁️</span>
          Suas listas são vinculadas a esta conta e sincronizadas com a nuvem.
        </p>
      </section>
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
