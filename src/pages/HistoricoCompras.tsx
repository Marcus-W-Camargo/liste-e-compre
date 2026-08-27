import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CompraFinalizada } from '../types';
import { useAuth } from '../hooks/useAuth';
import { obterSessao } from '../utils/auth';
import { carregarComprasFinalizadas } from '../utils/storage';
import './HistoricoCompras.css';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function HistoricoCompras() { const { logado } = useAuth(); const navigate = useNavigate(); const [compras] = useState<CompraFinalizada[]>(() => carregarComprasFinalizadas(obterSessao().email)); useEffect(() => { if (!logado) navigate('/', { replace: true }); }, [logado, navigate]); const total = useMemo(() => compras.reduce((soma, compra) => soma + compra.valorTotal, 0), [compras]); if (!logado) return null; return <main className="pagina-historico"><div className="historico-topo"><div><p>Resumo das compras</p><h1>Histórico</h1></div><strong>Total gasto: {moeda.format(total)}</strong></div>{compras.length === 0 ? <p className="historico-vazio">Nenhuma compra finalizada ainda.</p> : <div className="lista-historico-compras">{[...compras].reverse().map((compra) => <article key={compra.id}><div><h2>{compra.nomeLista}</h2><p>{new Date(compra.dataFim).toLocaleString('pt-BR')}</p><small>{compra.itens.length} itens · extras: {moeda.format(compra.gastosAdicionais)}</small></div><strong>{moeda.format(compra.valorTotal)}</strong></article>)}</div>}<button className="voltar-catalogo" onClick={() => navigate('/compre')}>Voltar às listas</button></main>; }
