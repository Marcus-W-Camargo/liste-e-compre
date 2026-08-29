import { useState } from 'react';
import type { ListaSalva } from '../types';
import { viewportMobile } from '../utils/mobile';
import { ConfirmacaoExclusaoMobile } from './ConfirmacaoExclusaoMobile';
import './PainelListasSalvas.css';

interface PainelListasSalvasProps {
  historico: ListaSalva[];
  onExcluir: (id: string) => void;
  onRenomear: (lista: ListaSalva) => void;
  onSelecionar: (lista: ListaSalva) => void;
}

function formatarData(data: string): string {
  const dataFormatada = new Date(data);

  if (Number.isNaN(dataFormatada.getTime())) {
    return 'Data indisponível';
  }

  return dataFormatada.toLocaleDateString('pt-BR');
}

export function PainelListasSalvas({
  historico,
  onExcluir,
  onRenomear,
  onSelecionar,
}: PainelListasSalvasProps) {
  const [listaParaExcluir, setListaParaExcluir] = useState<ListaSalva | null>(null);

  function solicitarExclusao(lista: ListaSalva) {
    if (viewportMobile()) {
      setListaParaExcluir(lista);
      return;
    }

    onExcluir(lista.id);
  }

  function confirmarExclusao() {
    if (!listaParaExcluir) return;

    const id = listaParaExcluir.id;
    setListaParaExcluir(null);
    onExcluir(id);
  }

  return (
    <aside className="barra-lateral-listas">
      <h3>📋 Minhas Listas</h3>

      <div className="container-cards-laterais">
        {historico.length === 0 ? (
          <p className="lista-historico-vazia">
            Nenhuma lista salva ainda.
          </p>
        ) : (
          historico.map((lista) => (
            <div
              key={lista.id}
              className="card-historico-lateral"
              role="button"
              tabIndex={0}
              onClick={() => onSelecionar(lista)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelecionar(lista);
                }
              }}
            >
              <div className="info-card-lat">
                <div className="nome-lista-linha">
                  <h4>{lista.nome}</h4>

                  <button
                    type="button"
                    className="botao-renomear-lista"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRenomear(lista);
                    }}
                    aria-label={`Renomear lista ${lista.nome}`}
                    title="Renomear lista"
                  >
                    ✏️
                  </button>
                </div>

                <p>{lista.itens.length} itens</p>
                <p>Modificada em {formatarData(lista.data)}</p>
              </div>

              <div className="acoes-card-lat">
                <button
                  type="button"
                  className="botao-excluir-lista"
                  onClick={(event) => {
                    event.stopPropagation();
                    solicitarExclusao(lista);
                  }}
                  aria-label={`Excluir lista ${lista.nome}`}
                  title="Excluir lista"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmacaoExclusaoMobile
        aberto={listaParaExcluir !== null}
        tipo="lista"
        nome={listaParaExcluir?.nome ?? ''}
        onCancelar={() => setListaParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </aside>
  );
}
