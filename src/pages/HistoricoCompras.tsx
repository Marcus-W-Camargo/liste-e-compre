import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import type { CompraFinalizada } from '../types';
import { obterSessao } from '../utils/auth';
import {
  carregarComprasFinalizadas,
  carregarEdicaoAtual,
  carregarHistoricoListas,
  carregarListaAtual,
  carregarSessaoCompra,
  salvarListaAtual,
} from '../utils/storage';
import { resolverDestinoRetornoHistorico } from '../utils/purchaseNavigation';
import {
  agruparItensDaCompra,
  criarItensParaRefazerCompra,
} from '../utils/purchaseHistory';
import { Modal } from '../components/Modal';
import './HistoricoCompras.css';

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

type ModalHistorico = null | 'acoes' | 'itens' | 'substituir';

function formatarQuantidade(quantidade: number, tipo: 'un' | 'Kg') {
  if (tipo === 'Kg') {
    return `${quantidade.toLocaleString('pt-BR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })} kg`;
  }

  return `${quantidade} ${quantidade === 1 ? 'unidade' : 'unidades'}`;
}

export function HistoricoCompras() {
  const { logado } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = obterSessao().email;
  const [compras] = useState<CompraFinalizada[]>(() =>
    carregarComprasFinalizadas(email),
  );
  const sessaoEmAndamento = carregarSessaoCompra(email);
  const listasSalvas = carregarHistoricoListas(email);
  const retornoSolicitado = (location.state as
    | { retornoCompras?: unknown }
    | null)?.retornoCompras;
  const destinoCompras = resolverDestinoRetornoHistorico(
    retornoSolicitado,
    sessaoEmAndamento,
    listasSalvas.map((lista) => lista.id),
  );
  const deveContinuarCompra = destinoCompras !== '/compre';
  const total = useMemo(
    () => compras.reduce((soma, compra) => soma + compra.valorTotal, 0),
    [compras],
  );
  const [indoParaCompras, setIndoParaCompras] = useState(false);
  const [compraSelecionada, setCompraSelecionada] =
    useState<CompraFinalizada | null>(null);
  const [modal, setModal] = useState<ModalHistorico>(null);

  useEffect(() => {
    if (!logado) navigate('/', { replace: true });
    return () =>
      document.body.classList.remove('transicao-historico-para-compras');
  }, [logado, navigate]);

  function irParaCompras() {
    if (indoParaCompras) return;

    setIndoParaCompras(true);
    document.body.classList.add('transicao-historico-para-compras');
    window.setTimeout(() => navigate(destinoCompras), 360);
  }

  function abrirAcoes(compra: CompraFinalizada) {
    setCompraSelecionada(compra);
    setModal('acoes');
  }

  function fecharModal() {
    setModal(null);
    setCompraSelecionada(null);
  }

  function solicitarRefazerCompra() {
    if (!compraSelecionada) return;

    const listaAtual = carregarListaAtual(email);
    const edicaoAtual = carregarEdicaoAtual(email);
    if (listaAtual.length > 0 || edicaoAtual) {
      setModal('substituir');
      return;
    }

    refazerCompra();
  }

  function refazerCompra() {
    if (!compraSelecionada) return;

    salvarListaAtual(
      email,
      criarItensParaRefazerCompra(compraSelecionada),
      null,
    );
    setModal(null);
    setCompraSelecionada(null);
    navigate('/lista');
  }

  const gruposItens = compraSelecionada
    ? agruparItensDaCompra(compraSelecionada.itens)
    : [];

  const gestosNavegacao = useSwipeNavigation({
    aoDeslizarDireita: irParaCompras,
  });

  if (!logado) return null;

  return (
    <main className="pagina-historico" {...gestosNavegacao}>
      <div className="historico-topo">
        <div>
          <p>Resumo das compras</p>
          <h1>Histórico</h1>
        </div>
        <strong>Total gasto: {moeda.format(total)}</strong>
      </div>

      {compras.length === 0 ? (
        <p className="historico-vazio">Nenhuma compra finalizada ainda.</p>
      ) : (
        <div className="lista-historico-compras">
          {[...compras].reverse().map((compra) => (
            <article key={compra.id}>
              <button
                type="button"
                className="historico-card-acionador"
                onClick={() => abrirAcoes(compra)}
                aria-label={`Abrir opções da compra ${compra.nomeLista}`}
                aria-haspopup="dialog"
              />
              <div className="historico-card-resumo">
                <h2>{compra.nomeLista}</h2>
                <p>{new Date(compra.dataFim).toLocaleString('pt-BR')}</p>
                <small>
                  {compra.itens.length} itens · Extras:{' '}
                  {moeda.format(compra.gastosAdicionais)}
                </small>
              </div>
              <strong>{moeda.format(compra.valorTotal)}</strong>
            </article>
          ))}
        </div>
      )}

      <button className="voltar-catalogo" onClick={irParaCompras}>
        {deveContinuarCompra ? 'Continuar compra' : 'Voltar às listas'}
      </button>

      <Modal aberto={modal === 'acoes'} onFechar={fecharModal}>
        <div className="historico-modal historico-modal-acoes">
          <span className="historico-modal-icone" aria-hidden="true">
            🧾
          </span>
          <h2>{compraSelecionada?.nomeLista}</h2>
          <p>O que deseja fazer com esta compra?</p>

          <div className="historico-modal-botoes">
            <button
              type="button"
              className="historico-acao-principal"
              onClick={solicitarRefazerCompra}
            >
              <span aria-hidden="true">↻</span>
              Refazer a mesma compra
            </button>
            <button
              type="button"
              className="historico-acao-secundaria"
              onClick={() => setModal('itens')}
            >
              <span aria-hidden="true">📋</span>
              Ver itens da compra
            </button>
            <button
              type="button"
              className="historico-acao-cancelar"
              onClick={fecharModal}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal aberto={modal === 'itens'} onFechar={fecharModal}>
        <div className="historico-modal historico-modal-itens">
          <div className="historico-itens-cabecalho">
            <span className="historico-modal-icone" aria-hidden="true">
              🛒
            </span>
            <div>
              <h2>Itens da compra</h2>
              <p>{compraSelecionada?.nomeLista}</p>
            </div>
          </div>

          <div className="historico-itens-lista">
            {gruposItens.map((grupo) => (
              <section key={grupo.categoria.value}>
                <h3>{grupo.categoria.label}</h3>
                <ul>
                  {grupo.itens.map((item) => (
                    <li key={item.id}>
                      <span className="historico-item-nome">
                        <strong>{item.nome}</strong>
                        {item.origem === 'extra' ? <small>Extra</small> : null}
                      </span>
                      <span className="historico-item-quantidade">
                        {formatarQuantidade(item.quantidade, item.tipo)}
                      </span>
                      <strong className="historico-item-total">
                        {moeda.format(item.precoUnitario * item.quantidade)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <button
            type="button"
            className="historico-voltar-acoes"
            onClick={() => setModal('acoes')}
          >
            Voltar às opções
          </button>
        </div>
      </Modal>

      <Modal aberto={modal === 'substituir'} onFechar={fecharModal}>
        <div className="historico-modal historico-modal-substituir">
          <span className="historico-modal-icone" aria-hidden="true">
            ⚠️
          </span>
          <h2>Substituir lista em criação?</h2>
          <p>
            Os itens que estão na criação de lista serão substituídos pelos
            itens desta compra.
          </p>
          <div className="historico-modal-botoes">
            <button
              type="button"
              className="historico-acao-principal"
              onClick={refazerCompra}
            >
              Refazer esta compra
            </button>
            <button
              type="button"
              className="historico-acao-cancelar"
              onClick={fecharModal}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
