import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { useListaCompras } from '../hooks/useListaCompras';
import type { ListaSalva } from '../types';

import { FormularioItem } from '../components/FormularioItem';
import { ListaItens } from '../components/ListaItens';
import { Modal } from '../components/Modal';
import { PainelListasSalvas } from '../components/PainelListasSalvas';

import iconeLista from '../assets/Liste.png';
import './Lista.css';

type ModalTipo =
  | null
  | 'nomear'
  | 'renomear'
  | 'sucesso'
  | 'vazia'
  | 'duplicado'
  | 'nao-salva';

export function Lista() {
  const {
    itens,
    itensFiltrados,
    historico,
    filtroCategoria,
    setFiltroCategoria,
    adicionarItem,
    atualizarItem,
    removerItem,
    salvarListaComNome,
    excluirListaSalva,
    renomearListaSalva,
    listaEmEdicaoId,
    carregarListaSalva,
    salvarEdicaoAtual,
  } = useListaCompras();

  const { logado } = useAuth();
  const navigate = useNavigate();

  const [modal, setModal] = useState<ModalTipo>(null);
  const [nomeLista, setNomeLista] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [listaEmEdicao, setListaEmEdicao] =
    useState<ListaSalva | null>(null);
  const [listaPendente, setListaPendente] =
    useState<ListaSalva | null>(null);
  const [mensagemRenomear, setMensagemRenomear] = useState('');
  const [indoParaCompras, setIndoParaCompras] = useState(false);

  useEffect(() => {
    document.body.classList.add('body-lista');
    document.body.classList.remove('body-home');

    return () => {
      document.body.classList.remove('body-lista');
    };
  }, []);

  useEffect(() => {
    if (!logado) {
      navigate('/', { replace: true });
    }
  }, [logado, navigate]);

  useEffect(() => {
    return () => document.body.classList.remove('transicao-para-compras');
  }, []);

  function irParaCompras() {
    if (indoParaCompras) return;

    setIndoParaCompras(true);
    document.body.classList.add('transicao-para-compras');
    window.setTimeout(() => navigate('/compre'), 360);
  }

  function fecharModal() {
    setModal(null);
    setListaEmEdicao(null);
    setMensagemRenomear('');
  }

  function cancelarTrocaDeLista() {
    setModal(null);
    setListaPendente(null);
  }

  function carregarListaPendente() {
    if (!listaPendente) return;

    carregarListaSalva(listaPendente.id);
    setListaPendente(null);
    setNomeLista('');
    setModal(null);
  }

  function handleSalvarClick() {
    if (itens.length === 0) {
      setModal('vazia');
      return;
    }

    if (listaEmEdicaoId) {
      const resultado = salvarEdicaoAtual();

      if (resultado) {
        setMensagemSucesso(
          `A lista "${resultado.nome}" foi atualizada com sucesso.`,
        );
        setModal('sucesso');
      }

      return;
    }

    setNomeLista('');
    setModal('nomear');
  }

  function selecionarListaSalva(lista: ListaSalva) {
    if (lista.id === listaEmEdicaoId) return;

    if (itens.length === 0) {
      carregarListaSalva(lista.id);
      return;
    }

    setListaPendente(lista);
    setModal('nao-salva');
  }

  function confirmarNome() {
    const resultado = salvarListaComNome(nomeLista);

    if (!resultado.ok) {
      if (resultado.motivo === 'vazia') {
        setModal('vazia');
      } else {
        setModal('duplicado');
      }

      return;
    }

    if (listaPendente) {
      carregarListaPendente();
      return;
    }

    setNomeLista('');
    setMensagemSucesso(
      `A lista "${resultado.lista.nome}" foi salva com sucesso.`,
    );
    setModal('sucesso');
  }

  function salvarAtualECarregarPendente() {
    if (!listaPendente) return;

    if (listaEmEdicaoId) {
      const resultado = salvarEdicaoAtual();

      if (resultado) {
        carregarListaPendente();
      }

      return;
    }

    setNomeLista('');
    setModal('nomear');
  }

  function iniciarRenomeacao(lista: ListaSalva) {
    setListaEmEdicao(lista);
    setNomeLista(lista.nome);
    setMensagemRenomear('');
    setModal('renomear');
  }

  function confirmarRenomeacao() {
    if (!listaEmEdicao) return;

    const resultado = renomearListaSalva(
      listaEmEdicao.id,
      nomeLista,
    );

    if (!resultado.ok) {
      setMensagemRenomear(
        resultado.motivo === 'nome-vazio'
          ? 'Digite um nome para a lista.'
          : 'Já existe uma lista com este nome.',
      );
      return;
    }

    setNomeLista('');
    fecharModal();
  }

  return (
    <div className="body-lista">
      <button
        type="button"
        className="botao-ir-compras"
        onClick={irParaCompras}
        disabled={indoParaCompras}
        aria-label="Ir para suas listas de compras"
        title="Ir para compras"
      >
        <span aria-hidden="true">→</span>
      </button>

      <PainelListasSalvas
        historico={historico}
        onExcluir={excluirListaSalva}
        onRenomear={iniciarRenomeacao}
        onSelecionar={selecionarListaSalva}
      />

      <main className="container-principal">
        <div className="titulo-pagina-lista">
          <div className="icone-titulo-lista">
            <img src={iconeLista} alt="" aria-hidden="true" />
          </div>

          <span>Criar Lista</span>

          <div aria-hidden="true" />
        </div>

        <FormularioItem onAdicionar={adicionarItem} />

        <ListaItens
          itens={itensFiltrados}
          filtro={filtroCategoria}
          onFiltroChange={setFiltroCategoria}
          onAtualizar={atualizarItem}
          onRemover={removerItem}
          onSalvarLista={handleSalvarClick}
        />
      </main>

      <Modal
        aberto={modal === 'nao-salva'}
        onFechar={cancelarTrocaDeLista}
      >
        <div className="conteudo-sucesso">
          <div className="icone-sucesso-laranja">⚠️</div>

          <h2>Lista não salva</h2>

          <p>
            Existem itens na lista atual. Se continuar, eles serão
            perdidos.
          </p>

          <button
            type="button"
            className="botao-enviar"
            onClick={carregarListaPendente}
          >
            Continuar sem salvar
          </button>

          <button
            type="button"
            className="botao-enviar"
            onClick={salvarAtualECarregarPendente}
          >
            Salvar lista atual
          </button>

          <button
            type="button"
            className="link-corrigir"
            onClick={cancelarTrocaDeLista}
          >
            Cancelar
          </button>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'nomear'}
        onFechar={() => {
          setModal(null);
          setListaPendente(null);
        }}
      >
        <div className="form-conteudo modal-nome-lista">
          <h2>💾 Nomear sua lista</h2>

          <p>
            Dê um nome para identificar essa lista de compras.
          </p>

          <div className="grupo-campo">
            <input
              type="text"
              value={nomeLista}
              onChange={(event) => setNomeLista(event.target.value)}
              placeholder="Ex: Compras do mês, Churrasco..."
              autoComplete="off"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  confirmarNome();
                }
              }}
            />
          </div>

          <div className="grupo-botoes-bloqueio">
            <button
              type="button"
              className="botao-enviar"
              onClick={confirmarNome}
            >
              Confirmar e salvar
            </button>

            <button
              type="button"
              className="link-corrigir"
              onClick={() => {
                setModal(null);
                setListaPendente(null);
              }}
            >
              Voltar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'renomear'}
        onFechar={fecharModal}
      >
        <div className="form-conteudo modal-nome-lista">
          <h2>✏️ Renomear lista</h2>

          <p>Escolha um novo nome para esta lista.</p>

          <div className="grupo-campo">
            <input
              type="text"
              value={nomeLista}
              onChange={(event) => {
                setNomeLista(event.target.value);
                setMensagemRenomear('');
              }}
              autoComplete="off"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  confirmarRenomeacao();
                }
              }}
            />
          </div>

          {mensagemRenomear && (
            <p className="mensagem-renomear-erro">
              {mensagemRenomear}
            </p>
          )}

          <button
            type="button"
            className="botao-enviar"
            onClick={confirmarRenomeacao}
          >
            Confirmar alteração
          </button>

          <button
            type="button"
            className="link-corrigir"
            onClick={fecharModal}
          >
            Voltar
          </button>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'duplicado'}
        onFechar={() => setModal('nomear')}
      >
        <div className="conteudo-sucesso">
          <div className="icone-sucesso-laranja">📋</div>

          <h2>Nome já utilizado!</h2>

          <p>
            Já existe uma lista salva com este nome. Escolha um
            título diferente.
          </p>

          <button
            type="button"
            className="botao-enviar"
            onClick={() => setModal('nomear')}
          >
            Corrigir nome
          </button>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'sucesso'}
        onFechar={() => setModal(null)}
      >
        <div className="conteudo-sucesso">
          <div className="icone-sucesso-laranja">✓</div>

          <h2>Lista salva!</h2>

          <p>{mensagemSucesso}</p>

          <button
            type="button"
            className="botao-enviar"
            onClick={() => setModal(null)}
          >
            Perfeito
          </button>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'vazia'}
        onFechar={() => setModal(null)}
      >
        <div className="conteudo-sucesso">
          <div className="icone-sucesso-laranja">❌</div>

          <h2>Lista vazia!</h2>

          <p>
            Não é possível salvar uma lista sem nenhum produto.
            Adicione pelo menos um item antes de prosseguir.
          </p>

          <button
            type="button"
            className="botao-enviar"
            onClick={() => setModal(null)}
          >
            Entendido
          </button>
        </div>
      </Modal>
    </div>
  );
}
