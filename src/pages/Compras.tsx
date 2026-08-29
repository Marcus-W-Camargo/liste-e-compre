import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListaCompraCard } from '../components/ListaCompraCard';
import { useAuth } from '../hooks/useAuth';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import type { ListaSalva } from '../types';
import { atualizarDataPrevistaNoHistorico, carregarHistoricoListas } from '../utils/storage';
import { obterSessao } from '../utils/auth';
import './Compras.css';

export function Compras() {
  const { logado } = useAuth();
  const navigate = useNavigate();
  const [listas, setListas] = useState<ListaSalva[]>(() =>
    carregarHistoricoListas(obterSessao().email),
  );
  const [listaAbertaId, setListaAbertaId] = useState<string | null>(null);
  const [indoParaLista, setIndoParaLista] = useState(false);
  const [indoParaHistorico, setIndoParaHistorico] = useState(false);

  useEffect(() => {
    document.body.classList.remove('body-home', 'body-lista');

    return () =>
      document.body.classList.remove(
        'transicao-para-lista',
        'transicao-para-historico',
      );
  }, []);

  useEffect(() => {
    if (!logado) {
      navigate('/', { replace: true });
      return;
    }
  }, [logado, navigate]);

  function agendarCompra(id: string, dataPrevista: string) {
    const listaAtualizada = atualizarDataPrevistaNoHistorico(obterSessao().email, id, dataPrevista);
    if (listaAtualizada) {
      setListas((atuais) => atuais.map((lista) => lista.id === id ? listaAtualizada : lista));
    }
  }

  function iniciarCompra(lista: ListaSalva) {
    navigate(`/compre/${lista.id}`);
  }

  function irParaLista() {
    if (indoParaLista) return;

    setIndoParaLista(true);
    document.body.classList.add('transicao-para-lista');
    window.setTimeout(() => navigate('/lista'), 360);
  }

  function irParaHistorico() {
    if (indoParaHistorico) return;

    setIndoParaHistorico(true);
    document.body.classList.add('transicao-para-historico');
    window.setTimeout(
      () =>
        navigate('/historico', {
          state: { retornoCompras: '/compre' },
        }),
      360,
    );
  }

  const gestosNavegacao = useSwipeNavigation({
    aoDeslizarEsquerda: irParaHistorico,
    aoDeslizarDireita: irParaLista,
  });

  if (!logado) return null;

  return (
    <main className="pagina-compras" {...gestosNavegacao}>
      <button
        type="button"
        className="botao-voltar-lista"
        onClick={irParaLista}
        disabled={indoParaLista}
        aria-label="Voltar para criar lista"
        title="Voltar para criar lista"
      >
        <span aria-hidden="true">←</span>
      </button>

      <button
        type="button"
        className="botao-ir-historico"
        onClick={irParaHistorico}
        disabled={indoParaHistorico}
        aria-label="Ir para o histórico de compras"
        title="Ir para o histórico"
      >
        <span aria-hidden="true">→</span>
      </button>

      <section className="catalogo-listas" aria-labelledby="titulo-suas-listas">
        <div className="cabecalho-catalogo">
          <h1 id="titulo-suas-listas"><span aria-hidden="true">🛒</span>Suas Listas</h1>
        </div>
        {listas.length === 0 && <p className="estado-vazio-listas">Você ainda não tem listas salvas. Crie a primeira para começar suas compras.</p>}
        <div className="grid-listas-compras">
          {listas.map((lista) => <ListaCompraCard key={lista.id} lista={lista} menuAberto={listaAbertaId === lista.id} onAlternarMenu={() => setListaAbertaId((atual) => atual === lista.id ? null : lista.id)} onIniciarCompra={iniciarCompra} onAgendar={agendarCompra} />)}
          <button type="button" className="card-nova-lista" onClick={() => navigate('/lista')} aria-label="Criar nova lista"><span aria-hidden="true">+</span><strong>Nova lista</strong><small>Crie uma lista para comprar</small></button>
        </div>
      </section>
    </main>
  );
}
