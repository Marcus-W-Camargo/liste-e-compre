import type { Item as ItemType, TipoMedida } from '../types';
import './Item.css';

interface ItemProps {
  item: ItemType;
  onAtualizar: (id: string, patch: Partial<ItemType>) => void;
  onRemover: (id: string) => void;
}

function formatarQtd(qtd: number, tipo: TipoMedida): string {
  if (tipo === 'Kg') {
    return qtd.toLocaleString('pt-BR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  }

  return String(qtd);
}

function mascaraPeso(valor: string): string {
  const apenasNumeros = valor.replace(/\D/g, '');

  if (!apenasNumeros) {
    return '0,000';
  }

  return (parseInt(apenasNumeros, 10) / 1000).toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function Item({ item, onAtualizar, onRemover }: ItemProps) {
  function handleQtdChange(valor: string) {
    if (item.tipo === 'Kg') {
      const mascarado = mascaraPeso(valor);
      const limpo = mascarado.replace(/\./g, '').replace(',', '.');
      const novaQtd = parseFloat(limpo) || 0;

      onAtualizar(item.id, { quantidade: novaQtd });
      return;
    }

    const limpo = valor.replace(/\D/g, '') || '1';
    const novaQtd = Math.max(1, parseInt(limpo, 10));

    onAtualizar(item.id, { quantidade: novaQtd });
  }

  function handleTipoChange(novoTipo: TipoMedida) {
    if (novoTipo === item.tipo) {
      return;
    }

    const novaQtd =
      novoTipo === 'Kg'
        ? item.quantidade
        : Math.max(1, Math.round(item.quantidade));

    onAtualizar(item.id, {
      tipo: novoTipo,
      quantidade: novaQtd,
    });
  }

  function incrementar() {
    onAtualizar(item.id, { quantidade: item.quantidade + 1 });
  }

  function decrementar() {
    onAtualizar(item.id, {
      quantidade: Math.max(1, item.quantidade - 1),
    });
  }

  const tipoKg = item.tipo === 'Kg';
  const idSwitch = `chk-tipo-medida-${item.id}`;

  return (
    <li className="item-lista-produto">
      <div className="container-check-info">
        <div className="info-texto-produto">
          <span className="nome-item-txt">{item.nome}</span>
          <span className="categoria-badge-txt">{item.categoria}</span>
        </div>
      </div>

      <div className="controles-item-lista">
        <div className="wrapper-input-spinner-item">
          <input
            type="text"
            className={`input-quantidade-item ${
              tipoKg ? 'input-quantidade-item--kg' : ''
            }`}
            inputMode="decimal"
            value={formatarQtd(item.quantidade, item.tipo)}
            onChange={(event) => handleQtdChange(event.target.value)}
            aria-label={`Quantidade de ${item.nome}`}
          />

          {!tipoKg && (
            <div className="sub-botoes-coluna-item">
              <button
                type="button"
                onClick={incrementar}
                aria-label={`Aumentar quantidade de ${item.nome}`}
              >
                +
              </button>

              <button
                type="button"
                onClick={decrementar}
                aria-label={`Diminuir quantidade de ${item.nome}`}
              >
                -
              </button>
            </div>
          )}
        </div>

        <div className="container-switch-medida-item">
          <input
            id={idSwitch}
            className="checkbox-switch-item"
            type="checkbox"
            checked={tipoKg}
            onChange={(event) =>
              handleTipoChange(event.target.checked ? 'Kg' : 'un')
            }
            aria-label={`Unidade de medida de ${item.nome}`}
          />

          <label htmlFor={idSwitch} className="corpo-switch-item">
            <span className="marcador-bola-item" />
            <span className="texto-opcao-un-item">📦</span>
            <span className="texto-opcao-kg-item">⚖️</span>
          </label>
        </div>

        <button
          type="button"
          className="btn-deletar-item-lista"
          onClick={() => onRemover(item.id)}
          title="Remover item"
          aria-label={`Remover ${item.nome}`}
        >
          🗑️
        </button>
      </div>
    </li>
  );
}