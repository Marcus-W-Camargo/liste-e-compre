import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ListaSalva } from '../types';

interface ListaCompraCardProps {
  lista: ListaSalva;
  menuAberto: boolean;
  onAlternarMenu: () => void;
  onIniciarCompra: (lista: ListaSalva) => void;
  onAgendar: (id: string, dataPrevista: string) => void;
}

function formatarData(data: string): string {
  const dataFormatada = new Date(
    data.length === 10 ? `${data}T12:00:00` : data,
  );
  return Number.isNaN(dataFormatada.getTime())
    ? 'Data indisponível'
    : dataFormatada.toLocaleDateString('pt-BR');
}

export function ListaCompraCard({ lista, menuAberto, onAlternarMenu, onIniciarCompra, onAgendar }: ListaCompraCardProps) {
  const [agendando, setAgendando] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState('');

  useEffect(() => {
    if (!menuAberto) setAgendando(false);
  }, [menuAberto]);

  function handleTecla(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onAlternarMenu();
    }
  }

  return (
    <div className="card-lista-compra-wrapper">
      <div className={`card-lista-compra ${menuAberto ? 'card-lista-compra-ativo' : ''}`} role="button" tabIndex={0} onClick={onAlternarMenu} onKeyDown={handleTecla} aria-expanded={menuAberto} aria-label={`Opções da lista ${lista.nome}`}>
        <h2>{lista.nome}</h2>
        <p>{lista.itens.length} {lista.itens.length === 1 ? 'item' : 'itens'}</p>
        <span className="card-lista-compra-data">
          {lista.dataPrevista ? `Agendada para ${formatarData(lista.dataPrevista)}` : `Modificada em ${formatarData(lista.data)}`}
        </span>
      </div>

      {menuAberto && (
        <div className="menu-acoes-lista" role="menu" onClick={onAlternarMenu}>
          {agendando ? (
            <div className="painel-agendamento" onClick={(event) => event.stopPropagation()}>
              <h3>Agendar compra</h3>
              <p>Escolha a data prevista.</p>
              <input
                type="date"
                value={dataSelecionada}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setDataSelecionada(event.target.value)}
                aria-label={`Data prevista para ${lista.nome}`}
                autoFocus
              />
              <button type="button" className="botao-confirmar-agendamento" onClick={(event) => { event.stopPropagation(); if (!dataSelecionada) return; onAgendar(lista.id, dataSelecionada); setAgendando(false); onAlternarMenu(); }}>
                Confirmar data
              </button>
              <button type="button" className="botao-voltar-agendamento" onClick={(event) => { event.stopPropagation(); setAgendando(false); }}>Voltar</button>
            </div>
          ) : (
            <>
              <button type="button" role="menuitem" className="botao-acao-compra" onClick={(event) => { event.stopPropagation(); onIniciarCompra(lista); onAlternarMenu(); }}>
                <span>Iniciar compra</span><b aria-hidden="true">→</b>
              </button>
              <p className="texto-escolha-compra">Escolha uma opção:</p>
              <button type="button" role="menuitem" className="botao-acao-compra" onClick={(event) => { event.stopPropagation(); setDataSelecionada(lista.dataPrevista ?? ''); setAgendando(true); }}>
                <span>Agendar compra</span><b aria-hidden="true">→</b>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
