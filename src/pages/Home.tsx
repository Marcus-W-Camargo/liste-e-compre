import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/Modal';
import tituloImg from '../assets/titulo.png';
import './Home.css';

export function Home() {
  const { logado } = useAuth();
  const navigate = useNavigate();

  const [modalAcesso, setModalAcesso] = useState(false);

  useEffect(() => {
    document.body.classList.add('body-home');
    document.body.classList.remove('body-lista');

    return () => {
      document.body.classList.remove('body-home');
    };
  }, []);

  function handleRotaProtegida(event: MouseEvent, path: string) {
    if (!logado) {
      event.preventDefault();
      setModalAcesso(true);
      return;
    }

    navigate(path);
  }

  return (
    <div className="body-home-wrapper">
      <main className="container-principal">
        <img
          src={tituloImg}
          alt="Liste e Compre"
          className="imagem-titulo"
        />

        <div className="fluxo-botoes">
          <a
            href="/lista"
            className="botao-lista btn-protegido"
            onClick={(event) =>
              handleRotaProtegida(event, '/lista')
            }
          >
            Crie sua lista <span>&rarr;</span>
          </a>

          <div className="seta-abaixo">↓</div>

          <a
            href="/compre"
            className="botao-lista btn-protegido"
            onClick={(event) =>
              handleRotaProtegida(event, '/compre')
            }
          >
            Faça sua compra <span>&rarr;</span>
          </a>

          <div className="seta-abaixo">↓</div>

          <a
            href="/historico"
            className="botao-lista btn-protegido"
            onClick={(event) =>
              handleRotaProtegida(event, '/historico')
            }
          >
            Histórico de compras <span>&rarr;</span>
          </a>
        </div>
      </main>

      <Modal
        aberto={modalAcesso}
        onFechar={() => setModalAcesso(false)}
      >
        <div className="conteudo-sucesso">
          <div
            className="icone-sucesso-laranja"
            style={{ fontSize: 24, paddingBottom: 2 }}
          >
            🔒
          </div>

          <h2>Acesso Negado</h2>

          <p>
            Para acessar as suas listas e históricos, você precisa
            estar conectado à sua conta cadastrada.
          </p>

          <div className="grupo-botoes-bloqueio">
            <Link
              to="/conta?modo=login"
              className="botao-enviar btn-bloqueio-link"
              onClick={() => setModalAcesso(false)}
            >
              Entrar
            </Link>

            <button
              type="button"
              className="link-corrigir"
              style={{ marginTop: 10 }}
              onClick={() => setModalAcesso(false)}
            >
              Voltar para a Home
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}