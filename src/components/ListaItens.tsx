import { useEffect, useRef, useState } from 'react';
import type { Item as ItemType } from '../types';
import { CATEGORIAS } from '../types';
import { Item } from './Item';
import './ListaItens.css';

interface ListaItensProps {
  itens: ItemType[];
  filtro: string;
  onFiltroChange: (valor: string) => void;
  onAtualizar: (id: string, patch: Partial<ItemType>) => void;
  onRemover: (id: string) => void;
  onSalvarLista: () => void;
}

export function ListaItens({
  itens,
  filtro,
  onFiltroChange,
  onAtualizar,
  onRemover,
  onSalvarLista,
}: ListaItensProps) {
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const filtroRef = useRef<HTMLDivElement>(null);

  const total = itens.length;
  const textoContador =
    total === 0 ? '0 itens' : total === 1 ? '1 item' : `${total} itens`;

  const filtroSelecionado =
    filtro === 'Geral'
      ? { value: 'Geral', label: '📋 Geral (Todos)' }
      : CATEGORIAS.find((categoria) => categoria.label === filtro) ?? {
          value: 'Geral',
          label: '📋 Geral (Todos)',
        };

  useEffect(() => {
    function fecharAoClicarFora(event: MouseEvent) {
      if (
        filtroRef.current &&
        !filtroRef.current.contains(event.target as Node)
      ) {
        setDropdownAberto(false);
      }
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownAberto(false);
      }
    }

    document.addEventListener('mousedown', fecharAoClicarFora);
    document.addEventListener('keydown', fecharComEscape);

    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora);
      document.removeEventListener('keydown', fecharComEscape);
    };
  }, []);

  function selecionarFiltro(valor: string) {
    onFiltroChange(valor);
    setDropdownAberto(false);
  }

  return (
    <div className="card-formulario lista-itens">
      <div className="lista-itens__conteudo">
        <div className="lista-itens__cabecalho">
          <h2>Itens Adicionados</h2>

          <div
            ref={filtroRef}
            className={`filtro-categoria-wrapper ${
              dropdownAberto ? 'ativo' : ''
            }`}
          >
            <button
              type="button"
              className="filtro-categoria-trigger"
              onClick={() => setDropdownAberto((atual) => !atual)}
              aria-expanded={dropdownAberto}
              aria-haspopup="listbox"
            >
              <span>{filtroSelecionado.label}</span>
              <span className="filtro-categoria-arrow" aria-hidden="true" />
            </button>

            {dropdownAberto && (
              <div
                className="filtro-categoria-dropdown"
                role="listbox"
                aria-label="Filtrar por categoria"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={filtro === 'Geral'}
                  className={`filtro-categoria-option ${
                    filtro === 'Geral' ? 'selecionado' : ''
                  }`}
                  onClick={() => selecionarFiltro('Geral')}
                >
                  📋 Geral (Todos)
                </button>

                {CATEGORIAS.map((categoria) => (
                  <button
                    key={categoria.value}
                    type="button"
                    role="option"
                    aria-selected={filtro === categoria.label}
                    className={`filtro-categoria-option ${
                      filtro === categoria.label ? 'selecionado' : ''
                    }`}
                    onClick={() => selecionarFiltro(categoria.label)}
                  >
                    {categoria.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="lista-itens__contador">{textoContador}</span>
        </div>

        <div className="wrapper-lista-degrade">
          {itens.length === 0 ? (
            <p className="lista-itens__vazio">
              {filtro === 'Geral'
                ? 'Sua lista está vazia. Adicione produtos acima!'
                : `Nenhum item adicionado em ${filtro}.`}
            </p>
          ) : (
            <ul id="lista-produtos-container">
              {itens.map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  onAtualizar={onAtualizar}
                  onRemover={onRemover}
                />
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          className="botao-enviar lista-itens__salvar"
          onClick={onSalvarLista}
        >
          💾 Salvar Lista
        </button>
      </div>
    </div>
  );
}