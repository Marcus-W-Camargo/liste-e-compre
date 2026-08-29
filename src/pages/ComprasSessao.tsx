import { useEffect, useId, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CATEGORIAS,
  type ItemCompra,
  type SessaoCompra,
  type TipoMedida,
} from '../types';
import { useAuth } from '../hooks/useAuth';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { obterSessao } from '../utils/auth';
import {
  adicionarItensAListaSalva,
  carregarHistoricoListas,
  criarSessaoCompra,
  finalizarCompra,
  gerarId,
  limparSessaoCompra,
  salvarSessaoCompra,
} from '../utils/storage';
import { Modal } from '../components/Modal';
import { cloud } from '../services/cloudData';
import iconeLista from '../assets/Liste.png';
import './ComprasSessao.css';

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function textoContagem(qtd: number) {
  return qtd === 1 ? '1 Item' : `${qtd} Itens`;
}

function tituloVisivel(titulo: string) {
  return titulo.replace(
    /^(?:\p{Extended_Pictographic}|\uFE0F|\u200D)+\s*/u,
    '',
  );
}

function iconeCategoria(categoria: string) {
  const encontrada = CATEGORIAS.find(
    (item) => categoria === item.label || categoria.includes(item.value),
  );
  const fonte = encontrada?.label ?? categoria;
  return fonte.match(/\p{Extended_Pictographic}/u)?.[0] ?? '🛒';
}

export function ComprasSessao() {
  const { listaId = '' } = useParams();
  const { logado } = useAuth();
  const navigate = useNavigate();
  const email = obterSessao().email;
  const [sessao, setSessao] = useState<SessaoCompra | null>(null);
  const [abertas, setAbertas] = useState<Record<string, boolean>>({
    Geral: true,
  });
  const [modal, setModal] = useState<
    'adicionar' | 'pendencias' | 'transferir' | null
  >(null);
  const [novo, setNovo] = useState<{
    nome: string;
    categoria: string;
    quantidade: string;
    tipo: TipoMedida;
  }>({
    nome: '',
    categoria: CATEGORIAS[0].label,
    quantidade: '1',
    tipo: 'un',
  });
  const [destino, setDestino] = useState('');
  const [finalizando, setFinalizando] = useState(false);
  const [indoParaHistorico, setIndoParaHistorico] = useState(false);

  useEffect(() => {
    if (!logado) {
      navigate('/', { replace: true });
      return;
    }
    const lista = carregarHistoricoListas(email).find(
      (item) => item.id === listaId,
    );
    if (!lista) {
      navigate('/compre', { replace: true });
      return;
    }
    setSessao(criarSessaoCompra(email, lista));
  }, [email, listaId, logado, navigate]);

  useEffect(() => {
    return () => document.body.classList.remove('transicao-para-historico');
  }, []);

  function atualizarItens(fn: (itens: ItemCompra[]) => ItemCompra[]) {
    if (!sessao) return;
    const proxima = { ...sessao, itens: fn(sessao.itens) };
    salvarSessaoCompra(email, proxima);
    setSessao(proxima);
  }

  const itens = sessao?.itens ?? [];
  const porcentagem = itens.length
    ? Math.round(
        (itens.filter((item) => item.pego).length / itens.length) * 100,
      )
    : 0;
  const total = itens
    .filter(
      (item) => item.pego && item.precoUnitario > 0 && item.quantidade > 0,
    )
    .reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0);

  function patch(id: string, patchItem: Partial<ItemCompra>) {
    atualizarItens((atuais) =>
      atuais.map((item) => {
        if (item.id !== id) return item;
        const proximo = { ...item, ...patchItem };
        const mudouValor =
          'precoUnitario' in patchItem || 'quantidade' in patchItem;
        return mudouValor
          ? {
              ...proximo,
              pego: proximo.precoUnitario > 0 && proximo.quantidade > 0,
            }
          : proximo;
      }),
    );
  }

  function adicionar() {
    const qtd = Number(novo.quantidade.replace(',', '.'));
    if (!novo.nome.trim() || qtd <= 0) return;
    atualizarItens((atuais) => [
      ...atuais,
      {
        id: gerarId(),
        nome: novo.nome.trim(),
        categoria: novo.categoria,
        quantidade: qtd,
        tipo: novo.tipo,
        precoUnitario: 0,
        pego: false,
        origem: 'extra',
      },
    ]);
    setNovo({
      nome: '',
      categoria: CATEGORIAS[0].label,
      quantidade: '1',
      tipo: 'un',
    });
    setModal(null);
  }

  function transferirPendentes() {
    if (!destino) return;
    const pendentes = itens.filter((item) => !item.pego);
    adicionarItensAListaSalva(
      email,
      destino,
      pendentes.map(
        ({
          precoUnitario: _preco,
          pego: _pego,
          origem: _origem,
          quantidadePlanejada: _qtd,
          ...item
        }) => item,
      ),
    );
    atualizarItens((atuais) => atuais.filter((item) => item.pego));
    setModal(null);
  }

  async function finalizar() {
    if (finalizando) return;
    if (itens.some((item) => !item.pego)) {
      setModal('pendencias');
      return;
    }
    if (!sessao) return;
    setFinalizando(true);
    finalizarCompra(email, {
      ...sessao,
      dataFim: new Date().toISOString(),
      valorTotal: total,
      porcentagemFinal: porcentagem,
      gastosAdicionais: itens
        .filter((item) => item.origem === 'extra')
        .reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0),
    });
    try {
      await cloud.flush();
      limparSessaoCompra(email);
      navigate('/historico');
    } catch {
      /* O aviso global mantém a edição e oferece nova tentativa. */
    } finally {
      setFinalizando(false);
    }
  }

  function renderSecao(titulo: string, lista: ItemCompra[]) {
    const chaveEstado = titulo.startsWith('Geral') ? 'Geral' : titulo;
    const aberta = abertas[chaveEstado] ?? false;

    return (
      <section
        key={chaveEstado}
        className={`secao-compra ${aberta ? 'secao-aberta' : ''}`}
      >
        <button
          type="button"
          className="cabecalho-secao-compra"
          onClick={() =>
            setAbertas((atual) => ({ ...atual, [chaveEstado]: !aberta }))
          }
        >
          <span>{tituloVisivel(titulo)}</span>
          <span className="meta-secao-compra">
            <small>{textoContagem(lista.length)}</small>
            <i
              className={`seta-secao ${aberta ? 'aberta' : ''}`}
              aria-hidden="true"
            />
          </span>
        </button>
        {aberta && (
          <div className="itens-compra">
            {lista.map((item) => (
              <LinhaCompra
                key={`${chaveEstado}-${item.id}`}
                item={item}
                onPatch={patch}
                onRemover={(id) =>
                  atualizarItens((atuais) =>
                    atuais.filter((atual) => atual.id !== id),
                  )
                }
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  function irParaHistorico() {
    if (indoParaHistorico) return;

    setIndoParaHistorico(true);
    document.body.classList.add('transicao-para-historico');
    window.setTimeout(() => navigate('/historico'), 360);
  }

  const gestosNavegacao = useSwipeNavigation({
    aoDeslizarEsquerda: irParaHistorico,
  });

  if (!sessao) return null;

  return (
    <main className="pagina-sessao-compra" {...gestosNavegacao}>
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

      <div className="topo-sessao">
        <div className="titulo-sessao">
          <img src={iconeLista} alt="" aria-hidden="true" />
          <div>
            <h1>{sessao.nomeLista}</h1>
            {sessao.dataPrevista && (
              <span>
                Agendada para{' '}
                {new Date(`${sessao.dataPrevista}T12:00:00`).toLocaleDateString(
                  'pt-BR',
                )}
              </span>
            )}
          </div>
        </div>

        <div className="progresso-sessao">
          <div
            className="anel-progresso"
            style={{ '--progresso': porcentagem } as CSSProperties}
            aria-hidden="true"
          >
            <span />
          </div>
          <span aria-label={`${porcentagem}% concluída`}>
            {porcentagem}% concluída
          </span>
        </div>
        <b className="total-parcial-sessao">
          Total parcial: {moeda.format(total)}
        </b>
      </div>

      {renderSecao('Geral (Todos)', itens)}

      {CATEGORIAS.map((categoria) => {
        const lista = itens.filter(
          (item) =>
            item.categoria === categoria.label ||
            item.categoria.includes(categoria.value),
        );
        return renderSecao(categoria.label, lista);
      })}

      <div className="acoes-sessao">
        <button type="button" onClick={() => setModal('adicionar')}>
          + Adicionar item
        </button>
        <button
          type="button"
          className="finalizar-compra"
          onClick={finalizar}
          disabled={finalizando}
        >
          {finalizando ? 'Salvando…' : 'Finalizar compra'}
        </button>
      </div>

      <Modal aberto={modal === 'adicionar'} onFechar={() => setModal(null)}>
        <div className="modal-compra">
          <h2>Adicionar item</h2>
          <input
            placeholder="Nome do item"
            value={novo.nome}
            onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          />
          <input
            type="number"
            min="0"
            step={novo.tipo === 'Kg' ? '0.001' : '1'}
            value={novo.quantidade}
            onChange={(e) => setNovo({ ...novo, quantidade: e.target.value })}
          />
          <select
            value={novo.categoria}
            onChange={(e) => setNovo({ ...novo, categoria: e.target.value })}
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={novo.tipo}
            onChange={(e) =>
              setNovo({ ...novo, tipo: e.target.value as TipoMedida })
            }
          >
            <option value="un">Unidade</option>
            <option value="Kg">Kg</option>
          </select>
          <button type="button" className="botao-enviar" onClick={adicionar}>
            Adicionar
          </button>
        </div>
      </Modal>

      <Modal aberto={modal === 'pendencias'} onFechar={() => setModal(null)}>
        <div className="modal-compra">
          <h2>Existem itens pendentes</h2>
          <p>
            Conclua, apague ou transfira os itens não marcados antes de
            finalizar.
          </p>
          <button
            type="button"
            className="botao-enviar"
            onClick={() => setModal('transferir')}
          >
            Transferir pendentes
          </button>
          <button
            type="button"
            className="botao-remover-pendentes"
            onClick={() => {
              atualizarItens((atual) => atual.filter((item) => item.pego));
              setModal(null);
            }}
          >
            Apagar pendentes
          </button>
          <button
            type="button"
            className="link-corrigir"
            onClick={() => setModal(null)}
          >
            Voltar
          </button>
        </div>
      </Modal>

      <Modal
        aberto={modal === 'transferir'}
        onFechar={() => setModal('pendencias')}
      >
        <div className="modal-compra">
          <h2>Transferir pendentes</h2>
          <select value={destino} onChange={(e) => setDestino(e.target.value)}>
            <option value="">Escolha a lista destino</option>
            {carregarHistoricoListas(email)
              .filter((lista) => lista.id !== sessao.listaId)
              .map((lista) => (
                <option key={lista.id} value={lista.id}>
                  {lista.nome}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="botao-enviar"
            onClick={transferirPendentes}
            disabled={!destino}
          >
            Confirmar transferência
          </button>
        </div>
      </Modal>
    </main>
  );
}

function LinhaCompra({
  item,
  onPatch,
  onRemover,
}: {
  item: ItemCompra;
  onPatch: (id: string, patch: Partial<ItemCompra>) => void;
  onRemover: (id: string) => void;
}) {
  const uid = useId();
  const idSwitch = `${uid}-tipo`;
  const tipoKg = item.tipo === 'Kg';
  const linhaTotal = item.precoUnitario * item.quantidade;

  return (
    <div className="linha-compra">
      <input
        type="checkbox"
        className="check-item-compra"
        checked={item.pego}
        onChange={(e) => onPatch(item.id, { pego: e.target.checked })}
        aria-label={`Concluir ${item.nome}`}
      />

      <span className="icone-item-compra" aria-hidden="true">
        {iconeCategoria(item.categoria)}
      </span>

      <strong>
        {item.nome}
        {item.origem === 'extra' ? <small> Extra</small> : null}
      </strong>

      <label className="campo-tracejado campo-preco">
        <span>R$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.precoUnitario || ''}
          placeholder="00,00"
          onChange={(e) =>
            onPatch(item.id, { precoUnitario: Number(e.target.value) || 0 })
          }
          aria-label={`Preço de ${item.nome}`}
        />
      </label>

      <div className="medida-item-compra">
        <span>{tipoKg ? 'Kg.' : 'Un.'}</span>
        <div className="switch-medida-compra">
          <input
            id={idSwitch}
            className="checkbox-switch-compra"
            type="checkbox"
            checked={tipoKg}
            onChange={(e) =>
              onPatch(item.id, { tipo: e.target.checked ? 'Kg' : 'un' })
            }
            aria-label={`Unidade de medida de ${item.nome}`}
          />
          <label htmlFor={idSwitch} className="corpo-switch-compra">
            <span className="bola-switch-compra" />
            <span className="texto-un-compra">📦</span>
            <span className="texto-kg-compra">⚖️</span>
          </label>
        </div>
      </div>

      <label className="campo-tracejado campo-qtd">
        <input
          type="number"
          min="0"
          step={tipoKg ? '0.001' : '1'}
          value={item.quantidade}
          onChange={(e) =>
            onPatch(item.id, { quantidade: Number(e.target.value) || 0 })
          }
          aria-label={`Quantidade de ${item.nome}`}
        />
      </label>

      <span className="total-linha-compra">{moeda.format(linhaTotal)}</span>

      <button
        type="button"
        className="btn-lixo-compra"
        onClick={() => onRemover(item.id)}
        aria-label={`Remover ${item.nome}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 7h14M10 7V5.8A1.8 1.8 0 0 1 11.8 4h.4A1.8 1.8 0 0 1 14 5.8V7m-7.2 0 .7 12.1A2 2 0 0 0 9.5 21h5a2 2 0 0 0 2-.9L17.2 7M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  );
}
