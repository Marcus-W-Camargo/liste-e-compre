import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import type { CompraFinalizada } from '../types';
import { obterSessao } from '../utils/auth';
import {
  carregarComprasFinalizadas,
  carregarHistoricoListas,
  carregarSessaoCompra,
} from '../utils/storage';
import './HistoricoCompras.css';

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function HistoricoCompras() {
  const { logado } = useAuth();
  const navigate = useNavigate();
  const email = obterSessao().email;
  const [compras] = useState<CompraFinalizada[]>(() =>
    carregarComprasFinalizadas(email),
  );
  const sessaoEmAndamento = carregarSessaoCompra(email);
  const sessaoAindaExiste =
    sessaoEmAndamento &&
    carregarHistoricoListas(email).some(
      (lista) => lista.id === sessaoEmAndamento.listaId,
    );
  const destinoCompras = sessaoAindaExiste
    ? `/compre/${sessaoEmAndamento.listaId}`
    : '/compre';
  const total = useMemo(
    () => compras.reduce((soma, compra) => soma + compra.valorTotal, 0),
    [compras],
  );
  const [indoParaCompras, setIndoParaCompras] = useState(false);

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
              <div>
                <h2>{compra.nomeLista}</h2>
                <p>{new Date(compra.dataFim).toLocaleString('pt-BR')}</p>
                <small>
                  {compra.itens.length} itens · extras:{' '}
                  {moeda.format(compra.gastosAdicionais)}
                </small>
              </div>
              <strong>{moeda.format(compra.valorTotal)}</strong>
            </article>
          ))}
        </div>
      )}

      <button className="voltar-catalogo" onClick={irParaCompras}>
        {sessaoAindaExiste ? 'Continuar compra' : 'Voltar às listas'}
      </button>
    </main>
  );
}
