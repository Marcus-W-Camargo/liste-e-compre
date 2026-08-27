import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CATEGORIAS, type TipoMedida } from '../types';
import './FormularioItem.css';

interface FormularioItemProps {
  onAdicionar: (dados: {
    nome: string;
    categoria: string;
    quantidade: number;
    tipo: TipoMedida;
  }) => void;
}

function mascaraPeso(valor: string): string {
  const apenasNumeros = valor.replace(/\D/g, '');

  if (!apenasNumeros) {
    return '0,000';
  }

  const decimal = parseInt(apenasNumeros, 10) / 1000;

  return decimal.toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function FormularioItem({ onAdicionar }: FormularioItemProps) {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [qtdTexto, setQtdTexto] = useState('0');
  const [tipoKg, setTipoKg] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState(false);

  const categoriaLabel =
    CATEGORIAS.find((item) => item.value === categoria)?.label ??
    '🔍 Categorias';

  const qtdNumerica = tipoKg
    ? parseFloat(qtdTexto.replace('.', '').replace(',', '.')) || 0
    : parseInt(qtdTexto, 10) || 0;

  const formValido =
    nome.trim().length > 0 && categoria !== '' && qtdNumerica > 0;

  useEffect(() => {
    if (tipoKg) {
      setQtdTexto(mascaraPeso(qtdTexto));
      return;
    }

    const limpo = qtdTexto.replace(/\D/g, '');
    const valorInteiro = Math.round(parseInt(limpo || '0', 10) / 1000);

    setQtdTexto(valorInteiro === 0 ? '0' : String(valorInteiro));
    // A conversão deve ocorrer somente quando a unidade for alterada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoKg]);

  function handleQtdChange(valor: string) {
    if (tipoKg) {
      setQtdTexto(mascaraPeso(valor));
      return;
    }

    let limpo = valor.replace(/\D/g, '');

    if (limpo === '') {
      limpo = '0';
    }

    if (limpo.length > 1 && limpo.startsWith('0')) {
      limpo = limpo.replace(/^0+/, '') || '0';
    }

    setQtdTexto(limpo);
  }

  function incrementar() {
    if (tipoKg) {
      const valor =
        parseInt(qtdTexto.replace(/\D/g, '') || '0', 10) + 100;

      setQtdTexto(mascaraPeso(String(valor)));
      return;
    }

    setQtdTexto(String((parseInt(qtdTexto, 10) || 0) + 1));
  }

  function decrementar() {
    if (tipoKg) {
      const valor = Math.max(
        0,
        parseInt(qtdTexto.replace(/\D/g, '') || '0', 10) - 100,
      );

      setQtdTexto(mascaraPeso(String(valor)));
      return;
    }

    const valor = Math.max(0, (parseInt(qtdTexto, 10) || 0) - 1);
    setQtdTexto(String(valor));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValido) {
      return;
    }

    const quantidade = tipoKg
      ? parseFloat(qtdTexto.replace('.', '').replace(',', '.')) || 0
      : parseInt(qtdTexto, 10) || 0;

    const categoriaSelecionada = CATEGORIAS.find(
      (item) => item.value === categoria,
    );

    onAdicionar({
      nome: nome.trim(),
      categoria: categoriaSelecionada?.label ?? categoria,
      quantidade,
      tipo: tipoKg ? 'Kg' : 'un',
    });

    setNome('');
    setCategoria('');
    setQtdTexto(tipoKg ? '0,000' : '0');
    setDropdownAberto(false);
  }

  return (
    <div className="card-formulario formulario-item">
      <form className="formulario-item__form" onSubmit={handleSubmit}>
        <div className="formulario-item__campo">
          <label htmlFor="nome-produto">Nome do Produto</label>

          <input
            id="nome-produto"
            type="text"
            placeholder="Ex: Arroz, Feijão, Sabonete..."
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            autoComplete="off"
            required
          />
        </div>

        <div className="formulario-item__linha">
          <div className="formulario-item__campo formulario-item__categoria">
            <label htmlFor="categoria-produto">Categoria</label>

            <div
              className={`custom-select-wrapper ${
                dropdownAberto ? 'ativo' : ''
              }`}
            >
              <button
                id="categoria-produto"
                type="button"
                className="custom-select-trigger"
                onClick={() => setDropdownAberto((atual) => !atual)}
                aria-expanded={dropdownAberto}
              >
                <span>{categoriaLabel}</span>
                <span className="custom-select-arrow" />
              </button>

              {dropdownAberto && (
                <div className="custom-select-dropdown">
                  {CATEGORIAS.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      className={`custom-select-option ${
                        categoria === cat.value ? 'selecionado' : ''
                      }`}
                      onClick={() => {
                        setCategoria(cat.value);
                        setDropdownAberto(false);
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="formulario-item__campo formulario-item__quantidade">
            <label htmlFor="quantidade-produto">Quantidade</label>

            <div className="wrapper-input-spinner-un">
              <input
                id="quantidade-produto"
                className={`input-quantidade ${
                  tipoKg ? 'input-quantidade--kg' : ''
                }`}
                type="text"
                inputMode="decimal"
                value={qtdTexto}
                onChange={(event) => handleQtdChange(event.target.value)}
              />

              {!tipoKg && (
                <div className="sub-botoes-coluna">
                  <button
                    type="button"
                    onClick={incrementar}
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={decrementar}
                    aria-label="Diminuir quantidade"
                  >
                    -
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="formulario-item__campo formulario-item__medida">
            <label htmlFor="chk-tipo-medida">
              Medida <span>({tipoKg ? 'kg.' : 'un.'})</span>
            </label>

            <div className="container-switch-medida">
              <input
                id="chk-tipo-medida"
                className="checkbox-switch-invisivel"
                type="checkbox"
                checked={tipoKg}
                onChange={(event) => setTipoKg(event.target.checked)}
              />

              <label
                htmlFor="chk-tipo-medida"
                className="corpo-switch-estilizado"
              >
                <span className="marcador-bola-deslizante" />
                <span className="texto-opcao-un">📦</span>
                <span className="texto-opcao-kg">⚖️</span>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={`botao-enviar ${
            formValido ? '' : 'btn-desativado-cinza'
          }`}
          disabled={!formValido}
        >
          Adicionar à Lista
        </button>
      </form>
    </div>
  );
}