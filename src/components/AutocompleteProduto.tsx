import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import {
  buscarProdutos,
  MINIMO_CARACTERES_PRODUTO,
} from '../utils/productSearch';
import './AutocompleteProduto.css';

interface AutocompleteProdutoProps {
  value: string;
  onValueChange: (valor: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
}

export function AutocompleteProduto({
  value,
  onValueChange,
  id,
  placeholder,
  required,
  autoFocus,
  ariaLabel,
}: AutocompleteProdutoProps) {
  const idInterno = useId().replaceAll(':', '');
  const idLista = `${id ?? idInterno}-sugestoes`;
  const raizRef = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(-1);
  const resultado = useMemo(() => buscarProdutos(value), [value]);
  const podeSugerir = value.replace(/\s/g, '').length >= MINIMO_CARACTERES_PRODUTO;
  const listaVisivel = aberto && podeSugerir;
  const indiceAtivoSeguro =
    indiceAtivo >= 0 && indiceAtivo < resultado.itens.length
      ? indiceAtivo
      : -1;

  useEffect(() => {
    function fecharAoClicarFora(event: PointerEvent) {
      if (raizRef.current && !raizRef.current.contains(event.target as Node)) {
        setAberto(false);
        setIndiceAtivo(-1);
      }
    }

    document.addEventListener('pointerdown', fecharAoClicarFora);
    return () => document.removeEventListener('pointerdown', fecharAoClicarFora);
  }, []);

  function selecionar(nome: string) {
    onValueChange(nome);
    setAberto(false);
    setIndiceAtivo(-1);
  }

  function tratarTecla(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setAberto(false);
      setIndiceAtivo(-1);
      return;
    }

    if (!resultado.itens.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setAberto(true);
      setIndiceAtivo((atual) => (atual + 1) % resultado.itens.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setAberto(true);
      setIndiceAtivo((atual) =>
        atual <= 0 ? resultado.itens.length - 1 : atual - 1,
      );
      return;
    }

    if (event.key === 'Enter' && listaVisivel && indiceAtivoSeguro >= 0) {
      event.preventDefault();
      selecionar(resultado.itens[indiceAtivoSeguro]);
    }
  }

  return (
    <div ref={raizRef} className="autocomplete-produto">
      <input
        id={id}
        className="autocomplete-produto__input"
        type="text"
        value={value}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        autoComplete="off"
        aria-label={ariaLabel}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={listaVisivel}
        aria-controls={listaVisivel ? idLista : undefined}
        aria-activedescendant={
          listaVisivel && indiceAtivoSeguro >= 0
            ? `${idLista}-opcao-${indiceAtivoSeguro}`
            : undefined
        }
        onFocus={() => {
          if (podeSugerir) setAberto(true);
        }}
        onChange={(event) => {
          onValueChange(event.target.value);
          setIndiceAtivo(-1);
          setAberto(event.target.value.replace(/\s/g, '').length >= MINIMO_CARACTERES_PRODUTO);
        }}
        onKeyDown={tratarTecla}
      />

      {listaVisivel ? (
        <div
          id={idLista}
          className="autocomplete-produto__lista"
          role="listbox"
          aria-label="Sugestões de produtos"
        >
          {resultado.itens.length ? (
            <>
              {resultado.itens.map((produto, indice) => (
                <button
                  id={`${idLista}-opcao-${indice}`}
                  key={produto}
                  type="button"
                  role="option"
                  aria-selected={indice === indiceAtivoSeguro}
                  className={indice === indiceAtivoSeguro ? 'ativo' : ''}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selecionar(produto)}
                >
                  {produto}
                </button>
              ))}
              {resultado.total > resultado.itens.length ? (
                <p className="autocomplete-produto__mais-resultados">
                  Mais {resultado.total - resultado.itens.length} resultados. Continue digitando.
                </p>
              ) : null}
            </>
          ) : (
            <p className="autocomplete-produto__vazio">
              Nenhuma sugestão. Você ainda pode usar esse nome.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
