import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import './Modal.css';
import './Header.css';
import { Link, useLocation } from 'react-router-dom';
import logoTitulo from '../assets/liste-&-compre.png';
import { useAuth } from '../hooks/useAuth';
import {
  carregarFotoPerfil,
  carregarFotoPerfilLocal,
  EVENTO_ATUALIZACAO_FOTO_PERFIL,
} from '../utils/profilePhoto';

export function Header() {
  const { id, logado, nome, logout, atualizarSessao } = useAuth();
  const location = useLocation();
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [modalLogout, setModalLogout] = useState(false);
  const [erroLogout, setErroLogout] = useState('');
  const [saindo, setSaindo] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(() =>
    id ? carregarFotoPerfilLocal(id) : null,
  );

  useLayoutEffect(() => {
    atualizarSessao();
  }, [atualizarSessao, location.pathname]);

  useEffect(() => {
    if (!logado || !id) {
      setFotoPerfil(null);
      return;
    }

    let ativo = true;

    async function atualizarFoto() {
      try {
        const fotoLocal = carregarFotoPerfilLocal(id);
        if (fotoLocal && ativo) setFotoPerfil(fotoLocal);
        const fotoSincronizada = await carregarFotoPerfil(id);
        if (ativo) setFotoPerfil(fotoSincronizada);
      } catch {
        if (ativo && !carregarFotoPerfilLocal(id)) setFotoPerfil(null);
      }
    }

    void atualizarFoto();

    function aoAtualizarFoto(evento: Event) {
      const detalhe = (evento as CustomEvent<{ usuarioId?: string }>).detail;
      if (detalhe?.usuarioId === id) void atualizarFoto();
    }

    window.addEventListener(EVENTO_ATUALIZACAO_FOTO_PERFIL, aoAtualizarFoto);
    return () => {
      ativo = false;
      window.removeEventListener(EVENTO_ATUALIZACAO_FOTO_PERFIL, aoAtualizarFoto);
    };
  }, [id, logado]);

  useEffect(() => {
    if (!dropdownAberto) return;

    function fecharDropdown() {
      setDropdownAberto(false);
    }

    document.addEventListener('click', fecharDropdown);

    return () => document.removeEventListener('click', fecharDropdown);
  }, [dropdownAberto]);

  async function confirmarLogout() {
    setSaindo(true);
    setErroLogout('');
    try {
      await logout();
      setModalLogout(false);
      setDropdownAberto(false);
    } catch (error) {
      setErroLogout(
        error instanceof Error ? error.message : 'Não foi possível sair.',
      );
    } finally {
      setSaindo(false);
    }
  }

  if (location.pathname === '/conta') return null;

  return (
    <>
      <div className="cabecalho-aplicacao">
        {location.pathname !== '/' && (
          <Link
            to="/"
            className="logo-voltar-home"
            aria-label="Voltar para a página inicial"
          >
            <img src={logoTitulo} alt="Liste e Compre" />
          </Link>
        )}

        <header className="menu-conta">
          {!logado ? (
            <div className="botoes-autenticacao">
              <Link to="/conta?modo=login" className="botao-topo">
                Entrar
              </Link>
              <Link to="/conta?modo=cadastro" className="botao-topo">
                Cadastrar
              </Link>
            </div>
          ) : (
            <div className="usuario-logado-topo" title={`Olá, ${nome}.`}>
              <span>Olá, {nome}.</span>
            </div>
          )}

          <button
            type="button"
            className={`icone-usuario ${fotoPerfil ? 'tem-foto-perfil' : ''} ${dropdownAberto ? 'menu-ativo' : ''}`}
            onClick={(event) => {
              event.stopPropagation();
              setDropdownAberto((atual) => !atual);
            }}
            aria-label="Menu da conta"
            aria-expanded={dropdownAberto}
          >
            {fotoPerfil ? (
              <img
                src={fotoPerfil}
                alt=""
                className="foto-usuario-topo"
                aria-hidden="true"
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                  fill="#1a263b"
                />
              </svg>
            )}
          </button>

          {dropdownAberto && (
            <div
              className="dropdown-conta"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="setinha-dropdown" />
              <div className="dropdown-conteudo">
                {logado && (
                  <>
                    <Link
                      to="/perfil"
                      className="item-dropdown"
                      onClick={() => setDropdownAberto(false)}
                    >
                      👤 Minha conta
                    </Link>
                    <Link
                      to="/ajuda"
                      className="item-dropdown"
                      onClick={() => setDropdownAberto(false)}
                    >
                      💡 Ajuda
                    </Link>
                  </>
                )}
                <a
                  href="https://marcuscamargo-portfolio.mcpt.workers.dev/"
                  className="item-dropdown"
                  onClick={() => setDropdownAberto(false)}
                >
                  🌐 Sobre
                </a>
                {logado && (
                  <>
                    <hr className="divisor-dropdown" />
                    <button
                      type="button"
                      className="item-dropdown btn-sair-dropdown"
                      onClick={() => {
                        setDropdownAberto(false);
                        setModalLogout(true);
                      }}
                    >
                      🚪 Sair
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </header>
      </div>

      <Modal
        aberto={modalLogout}
        onFechar={() => setModalLogout(false)}
        zIndex={2000}
      >
        <div className="conteudo-sucesso">
          <div
            className="icone-sucesso-laranja"
            style={{ fontSize: 24, paddingBottom: 2 }}
          >
            🚪
          </div>
          <h2>Sair da Conta?</h2>
          <p>
            Tem certeza que deseja sair? Aguardaremos a sincronização das suas
            listas antes de encerrar a sessão.
          </p>
          {erroLogout && <p role="alert">{erroLogout}</p>}
          <div className="grupo-botoes-bloqueio" style={{ gap: 10 }}>
            <button
              type="button"
              className="botao-enviar"
              style={{ width: '100%', marginTop: 5 }}
              onClick={confirmarLogout}
              disabled={saindo}
            >
              {saindo ? 'Sincronizando…' : 'Sim, Sair'}
            </button>
            <button
              type="button"
              className="link-corrigir"
              style={{ marginTop: 5 }}
              onClick={() => setModalLogout(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

interface ModalProps {
  aberto: boolean;
  onFechar?: () => void;
  children: ReactNode;
  zIndex?: number;
}

export function Modal({
  aberto,
  onFechar,
  children,
  zIndex = 2500,
}: ModalProps) {
  if (!aberto) return null;

  return (
    <>
      <div
        className="overlay-bloqueio"
        onClick={onFechar}
        style={{ zIndex: zIndex - 100 }}
        aria-hidden="true"
      />

      <div
        className="card-formulario card-bloqueio-home"
        style={{ zIndex }}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </>
  );
}
