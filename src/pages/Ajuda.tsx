import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import logoTitulo from '../assets/titulo.png';
import iconeLista from '../assets/Liste.png';
import './Ajuda.css';

type CenaGuia =
  | 'inicio'
  | 'criar-lista'
  | 'adicionar-itens'
  | 'salvar-lista'
  | 'listas-salvas'
  | 'catalogo'
  | 'compra'
  | 'historico';

type PassoGuia = {
  titulo: string;
  texto: string;
  dica: string;
  cena: CenaGuia;
};

const PASSOS_GUIA: PassoGuia[] = [
  {
    titulo: 'Comece pela página inicial',
    texto: 'Na página inicial, escolha Criar sua lista para preparar os produtos antes de ir ao mercado.',
    dica: 'O fluxo principal segue Lista → Compras → Histórico.',
    cena: 'inicio',
  },
  {
    titulo: 'Monte sua lista de compras',
    texto: 'Digite o produto, selecione a categoria, informe a quantidade e escolha a medida antes de adicionar o item.',
    dica: 'O botão de medida alterna entre unidade e quilo. O switch continua laranja e mostra 📦 para unidade ou ⚖️ para kg.',
    cena: 'criar-lista',
  },
  {
    titulo: 'Use as sugestões de produtos',
    texto: 'Ao digitar o nome, o sistema mostra sugestões para agilizar o preenchimento. Você também pode usar um nome próprio.',
    dica: 'A categoria escolhida ajuda a organizar os itens durante a compra.',
    cena: 'adicionar-itens',
  },
  {
    titulo: 'Salve e dê um nome à lista',
    texto: 'Quando terminar, use Salvar Lista. O menu de nomeação abre por cima da página para você identificar a lista.',
    dica: 'Escolha um nome fácil de reconhecer, como “Compra do mês”.',
    cena: 'salvar-lista',
  },
  {
    titulo: 'Reabra ou renomeie listas salvas',
    texto: 'Na lateral da tela ficam as listas salvas. Clique em uma lista para voltar a editá-la ou use o lápis para alterar somente o nome.',
    dica: 'Assim você reaproveita uma lista sem precisar começar novamente.',
    cena: 'listas-salvas',
  },
  {
    titulo: 'Escolha uma lista em Compras',
    texto: 'Na página Compras, clique no card da lista. O próprio card muda para o menu de ações, onde você pode iniciar ou agendar a compra.',
    dica: 'O menu aparece no mesmo espaço do card selecionado.',
    cena: 'catalogo',
  },
  {
    titulo: 'Registre a compra em andamento',
    texto: 'Informe preços e quantidades, altere a medida quando necessário e acompanhe o total parcial conforme avança.',
    dica: 'O check quadrado fica à esquerda e é marcado quando o item tem preço e quantidade válidos.',
    cena: 'compra',
  },
  {
    titulo: 'Consulte ou refaça pelo Histórico',
    texto: 'Depois de finalizar, a compra aparece no Histórico. Clique no card para abrir as ações e escolher entre refazer ou ver os itens.',
    dica: 'Ao refazer uma compra, os preços antigos não são reaproveitados.',
    cena: 'historico',
  },
];

const PERGUNTAS = [
  { pergunta: 'Como começo uma nova lista de compras?', resposta: 'Entre em Lista, preencha produto, categoria, quantidade e medida, adicione os itens e depois use Salvar Lista.' },
  { pergunta: 'Posso adicionar um produto que não aparece nas sugestões?', resposta: 'Sim. As sugestões servem para agilizar o preenchimento. Você pode digitar outro nome normalmente e escolher a categoria desejada.' },
  { pergunta: 'Como escolho entre unidade e quilo?', resposta: 'No formulário, use o switch de Medida. O ícone 📦 indica unidade e ⚖️ indica quilo. Em quilos, a quantidade usa três casas decimais.' },
  { pergunta: 'Como edito uma lista salva?', resposta: 'Na página Lista, clique em uma lista no painel Minhas Listas. Ela será reaberta para continuar a edição.' },
  { pergunta: 'Como mudo somente o nome de uma lista?', resposta: 'No painel Minhas Listas, clique no lápis ao lado do nome da lista e confirme o novo nome.' },
  { pergunta: 'Como inicio uma compra?', resposta: 'Abra Compras, clique no card da lista desejada e depois escolha Iniciar compra.' },
  { pergunta: 'Como registro o preço durante a compra?', resposta: 'Na compra em andamento, preencha o campo de preço do item. O total parcial é atualizado conforme os itens são concluídos.' },
  { pergunta: 'Posso usar a mesma compra novamente?', resposta: 'Sim. No Histórico, abra uma compra e escolha Refazer a mesma compra. Os itens retornam para uma nova lista, sem reutilizar os preços antigos.' },
  { pergunta: 'Como vejo os itens de uma compra antiga?', resposta: 'No Histórico, abra a compra desejada e escolha Ver itens da compra.' },
  { pergunta: 'Preciso estar conectado à internet?', resposta: 'Sim. A conta, as listas e as compras finalizadas são sincronizadas, então é necessário ter conexão para acessar e salvar essas informações.' },
];

function IconeUsuarioPadrao() {
  return (
    <span className="ajuda-mini-usuario" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#1a263b" />
      </svg>
    </span>
  );
}

function MolduraSite({ children }: { children: ReactNode }) {
  return (
    <div className="ajuda-mini-site" aria-hidden="true">
      <div className="ajuda-mini-cabecalho">
        <img src={logoTitulo} alt="" />
        <div className="ajuda-mini-conta"><span>Olá, Marcus.</span><IconeUsuarioPadrao /></div>
      </div>
      <div className="ajuda-mini-area">{children}</div>
    </div>
  );
}

function SwitchMedida({ kg = false }: { kg?: boolean }) {
  return (
    <span className={`ajuda-switch-medida${kg ? ' kg' : ''}`}>
      <span className="ajuda-switch-knob" />
      <span className="ajuda-switch-icone">{kg ? '⚖️' : '📦'}</span>
    </span>
  );
}

function FormularioLista({ sugestoes = false }: { sugestoes?: boolean }) {
  return (
    <div className="ajuda-formulario-lista">
      <div className="ajuda-form-campo ajuda-form-produto">
        <label>Nome do Produto</label>
        <div className={`ajuda-form-input${sugestoes ? ' ativo' : ''}`}>
          {sugestoes ? 'Arroz' : 'Ex: Arroz, Feijão, Sabonete...'}
        </div>
        {sugestoes && (
          <div className="ajuda-autocomplete">
            <span>Arroz Agulhinha</span>
            <span>Arroz Branco</span>
            <span>Arroz Integral</span>
          </div>
        )}
      </div>
      <div className="ajuda-form-linha">
        <div className="ajuda-form-campo ajuda-form-categoria">
          <label>Categoria</label>
          <div className="ajuda-select-real"><span>🍞 Mercearia</span><i /></div>
        </div>
        <div className="ajuda-form-campo ajuda-form-quantidade">
          <label>Quantidade</label>
          <div className="ajuda-quantidade-real"><strong>2</strong><span><b>+</b><b>−</b></span></div>
        </div>
        <div className="ajuda-form-campo ajuda-form-medida">
          <label>Medida <span>(un.)</span></label>
          <SwitchMedida />
        </div>
      </div>
      <div className="ajuda-botao-enviar-real">Adicionar à Lista</div>
    </div>
  );
}

function CursorAnimado({ className = '' }: { className?: string }) {
  return <span className={`ajuda-cursor-demo ${className}`} aria-hidden="true"><i /></span>;
}

function CenaInicio() {
  return (
    <MolduraSite>
      <div className="ajuda-home-real">
        <img src={logoTitulo} alt="" />
        <div className="ajuda-home-link">Crie sua lista <span>→</span></div>
        <div className="ajuda-home-seta">↓</div>
        <div className="ajuda-home-link">Faça sua compra <span>→</span></div>
        <div className="ajuda-home-seta">↓</div>
        <div className="ajuda-home-link">Histórico de compras <span>→</span></div>
      </div>
    </MolduraSite>
  );
}

function CenaCriarLista({ sugestoes = false }: { sugestoes?: boolean }) {
  return (
    <MolduraSite>
      <div className="ajuda-lista-pagina-real">
        <div className="ajuda-titulo-lista-real"><img src={iconeLista} alt="" /><strong>Criar Lista</strong></div>
        <FormularioLista sugestoes={sugestoes} />
      </div>
    </MolduraSite>
  );
}

function CenaSalvar() {
  return (
    <MolduraSite>
      <div className="ajuda-lista-pagina-real ajuda-cena-salvar">
        <div className="ajuda-titulo-lista-real"><img src={iconeLista} alt="" /><strong>Criar Lista</strong></div>
        <div className="ajuda-lista-card-real">
          <div className="ajuda-lista-cabecalho"><strong>Itens na lista</strong><span>3</span></div>
          <div className="ajuda-item-lista"><span>Arroz</span><strong>2 un.</strong></div>
          <div className="ajuda-item-lista"><span>Leite</span><strong>6 un.</strong></div>
          <div className="ajuda-item-lista"><span>Banana</span><strong>1,200 kg</strong></div>
          <div className="ajuda-salvar-wrapper"><div className="ajuda-salvar-real">Salvar Lista</div><CursorAnimado className="ajuda-cursor-salvar" /></div>
        </div>
        <div className="ajuda-overlay-interno" />
        <div className="ajuda-modal-nome-real">
          <h3>💾 Nomear sua lista</h3>
          <p>Dê um nome para identificar essa lista de compras.</p>
          <div className="ajuda-modal-input">Compra do mês</div>
          <div className="ajuda-botao-enviar-real">Confirmar e salvar</div>
          <span>Voltar</span>
        </div>
      </div>
    </MolduraSite>
  );
}

function CenaListasSalvas() {
  return (
    <MolduraSite>
      <div className="ajuda-listas-salvas-real">
        <aside className="ajuda-painel-listas-real">
          <h3>📋 Minhas Listas</h3>
          <div className="ajuda-card-lateral-real destaque">
            <div><div><strong>Compra do mês</strong><span>✏️</span></div><small>3 itens</small><em>Modificada em 29/08/2026</em></div><b>🗑️</b>
          </div>
          <div className="ajuda-card-lateral-real">
            <div><div><strong>Churrasco</strong><span>✏️</span></div><small>8 itens</small><em>Modificada em 27/08/2026</em></div><b>🗑️</b>
          </div>
        </aside>
        <div className="ajuda-lista-principal-mini">
          <div className="ajuda-titulo-lista-real"><img src={iconeLista} alt="" /><strong>Criar Lista</strong></div>
          <FormularioLista />
        </div>
      </div>
    </MolduraSite>
  );
}

function CenaCatalogo() {
  return (
    <MolduraSite>
      <div className="ajuda-catalogo-real">
        <h3><span>🛒</span>Suas Listas</h3>
        <div className="ajuda-card-compra-wrapper">
          <div className="ajuda-card-compra-real"><strong>Compra do mês</strong><p>12 itens</p><small>29/08/2026</small></div>
          <CursorAnimado className="ajuda-cursor-catalogo" />
          <div className="ajuda-menu-acoes-real"><div>Iniciar compra <b>›</b></div><span>Escolha uma ação</span><div>Agendar compra <b>›</b></div></div>
        </div>
      </div>
    </MolduraSite>
  );
}

function CenaCompra() {
  return (
    <MolduraSite>
      <div className="ajuda-compra-real">
        <div className="ajuda-topo-compra-real">
          <div><img src={iconeLista} alt="" /><strong>Compra do mês</strong></div>
          <span>50% concluída</span>
          <b>Total parcial: R$ 31,69</b>
        </div>
        <div className="ajuda-secao-compra-real">
          <div className="ajuda-secao-titulo"><strong>Geral (Todos)</strong><span>2 Itens ▲</span></div>
          <div className="ajuda-linha-compra-real impar">
            <span className="ajuda-check-real marcado">✓</span><span>🍞</span><strong>Arroz</strong>
            <div className="ajuda-campo-tracejado">R$ <b>24,90</b></div>
            <div className="ajuda-medida-compra"><span>Un.</span><SwitchMedida /></div>
            <div className="ajuda-campo-tracejado">2</div><b>R$ 49,80</b><span className="ajuda-lixo-real">⌫</span>
          </div>
          <div className="ajuda-linha-compra-real par">
            <span className="ajuda-check-real" /><span>🍎</span><strong>Banana</strong>
            <div className="ajuda-campo-tracejado">R$ <b>6,79</b></div>
            <div className="ajuda-medida-compra"><span>Kg.</span><SwitchMedida kg /></div>
            <div className="ajuda-campo-tracejado">1,200</div><b>R$ 8,15</b><span className="ajuda-lixo-real">⌫</span>
          </div>
        </div>
      </div>
    </MolduraSite>
  );
}

function CenaHistorico() {
  return (
    <MolduraSite>
      <div className="ajuda-historico-real">
        <div className="ajuda-historico-topo"><div><span>Seu</span><h3>Histórico</h3></div><strong>2 compras</strong></div>
        <div className="ajuda-card-historico-real"><div><strong>Compra do mês</strong><p>29/08/2026</p><small>Extras: R$ 12,50</small></div><b>R$ 286,40</b></div>
        <CursorAnimado className="ajuda-cursor-historico" />
        <div className="ajuda-overlay-interno ajuda-overlay-historico" />
        <div className="ajuda-modal-historico-real">
          <div className="ajuda-modal-icone">🧾</div><h3>O que deseja fazer?</h3><p>Escolha uma ação para esta compra.</p>
          <div className="ajuda-acao-historico principal">↻ Refazer a mesma compra</div>
          <div className="ajuda-acao-historico">📋 Ver itens da compra</div>
          <div className="ajuda-acao-historico cancelar">Cancelar</div>
        </div>
      </div>
    </MolduraSite>
  );
}

function IlustracaoGuia({ cena }: { cena: CenaGuia }) {
  if (cena === 'inicio') return <CenaInicio />;
  if (cena === 'criar-lista') return <CenaCriarLista />;
  if (cena === 'adicionar-itens') return <CenaCriarLista sugestoes />;
  if (cena === 'salvar-lista') return <CenaSalvar />;
  if (cena === 'listas-salvas') return <CenaListasSalvas />;
  if (cena === 'catalogo') return <CenaCatalogo />;
  if (cena === 'compra') return <CenaCompra />;
  return <CenaHistorico />;
}

export function Ajuda() {
  const [guiaAberto, setGuiaAberto] = useState(false);
  const [passoAtual, setPassoAtual] = useState(0);
  const [faqAberta, setFaqAberta] = useState<number | null>(null);
  const [sessaoGuia, setSessaoGuia] = useState(0);
  const toqueInicialX = useRef<number | null>(null);

  const abrirGuia = () => { setPassoAtual(0); setSessaoGuia((valor) => valor + 1); setGuiaAberto(true); };
  const fecharGuia = useCallback(() => setGuiaAberto(false), []);
  const irAnterior = useCallback(() => setPassoAtual((atual) => atual > 0 ? atual - 1 : atual), []);
  const irProximo = useCallback(() => setPassoAtual((atual) => atual < PASSOS_GUIA.length - 1 ? atual + 1 : atual), []);

  useEffect(() => {
    if (!guiaAberto) return;
    function controlarTeclado(evento: KeyboardEvent) {
      const alvo = evento.target;
      if (alvo instanceof Element && alvo.closest('input, textarea, select, [contenteditable="true"]')) return;
      const tecla = evento.key.toLowerCase();
      if (tecla === 'escape') { evento.preventDefault(); fecharGuia(); return; }
      if (!window.matchMedia('(min-width: 701px)').matches) return;
      if ((tecla === 'a' || tecla === 'arrowleft') && passoAtual > 0) { evento.preventDefault(); irAnterior(); }
      if ((tecla === 'd' || tecla === 'arrowright') && passoAtual < PASSOS_GUIA.length - 1) { evento.preventDefault(); irProximo(); }
    }
    document.addEventListener('keydown', controlarTeclado);
    return () => document.removeEventListener('keydown', controlarTeclado);
  }, [fecharGuia, guiaAberto, irAnterior, irProximo, passoAtual]);

  const passo = PASSOS_GUIA[passoAtual];
  const primeiroPasso = passoAtual === 0;
  const ultimoPasso = passoAtual === PASSOS_GUIA.length - 1;

  return (
    <main className="ajuda-pagina">
      <section className="ajuda-cabecalho"><span className="ajuda-kicker">Central de ajuda</span><h1>Como podemos ajudar?</h1><p>Veja o passo a passo do Liste & Compre ou encontre respostas rápidas para as dúvidas mais comuns.</p></section>
      <button className="ajuda-guia-chamada" type="button" onClick={abrirGuia}><span className="ajuda-guia-icone" aria-hidden="true">▶</span><span><strong>Aprenda a usar o Liste & Compre</strong><small>Do primeiro item até o histórico da compra.</small></span><span className="ajuda-guia-abrir">Abrir guia</span></button>

      <section className="ajuda-faq" aria-labelledby="titulo-faq">
        <div className="ajuda-faq-titulo"><span className="ajuda-kicker">Perguntas frequentes</span><h2 id="titulo-faq">Dúvidas comuns</h2><p>Toque em uma pergunta para abrir ou fechar a resposta.</p></div>
        <div className="ajuda-faq-lista">{PERGUNTAS.map((item, indice) => {
          const aberta = faqAberta === indice;
          return <article className={`ajuda-faq-item${aberta ? ' aberta' : ''}`} key={item.pergunta}><button type="button" className="ajuda-faq-pergunta" aria-expanded={aberta} aria-controls={`resposta-faq-${indice}`} onClick={() => setFaqAberta(aberta ? null : indice)}><span>{item.pergunta}</span><span className="ajuda-faq-sinal">{aberta ? '−' : '+'}</span></button><div className="ajuda-faq-resposta-wrapper" id={`resposta-faq-${indice}`} aria-hidden={!aberta}><div className="ajuda-faq-resposta"><p>{item.resposta}</p></div></div></article>;
        })}</div>
      </section>

      {guiaAberto && (
        <div className="ajuda-guia-overlay" role="presentation">
          <section className="ajuda-guia-modal" role="dialog" aria-modal="true" aria-label="Guia de uso do Liste & Compre"
            onTouchStart={(evento) => { toqueInicialX.current = evento.changedTouches[0]?.clientX ?? null; }}
            onTouchEnd={(evento) => {
              if (toqueInicialX.current === null) return;
              const fim = evento.changedTouches[0]?.clientX ?? toqueInicialX.current;
              const delta = fim - toqueInicialX.current;
              toqueInicialX.current = null;
              if (Math.abs(delta) < 45) return;
              if (delta < 0 && !ultimoPasso) irProximo();
              if (delta > 0 && !primeiroPasso) irAnterior();
            }}>
            <button className="ajuda-guia-fechar" type="button" onClick={fecharGuia} aria-label="Fechar guia"><span>×</span></button>
            <div className="ajuda-guia-progresso-texto">Passo {passoAtual + 1} de {PASSOS_GUIA.length}</div>
            <button className="ajuda-guia-seta ajuda-guia-seta--esquerda" type="button" onClick={irAnterior} disabled={primeiroPasso} aria-label="Passo anterior">‹</button>
            <div className="ajuda-guia-corpo" key={`${sessaoGuia}-${passoAtual}`}>
              <div className="ajuda-guia-ilustracao"><IlustracaoGuia cena={passo.cena} /></div>
              <div className="ajuda-guia-texto"><h2>{passo.titulo}</h2><p>{passo.texto}</p><div className="ajuda-guia-dica"><span>💡</span><span>{passo.dica}</span></div></div>
            </div>
            <button className="ajuda-guia-seta ajuda-guia-seta--direita" type="button" onClick={irProximo} disabled={ultimoPasso} aria-label="Próximo passo">›</button>
            <div className="ajuda-guia-rodape"><div className="ajuda-guia-bolinhas">{PASSOS_GUIA.map((item, indice) => <button key={item.titulo} type="button" className={`ajuda-guia-bolinha${indice === passoAtual ? ' ativa' : ''}`} onClick={() => setPassoAtual(indice)} aria-label={`Ir para o passo ${indice + 1}`} aria-current={indice === passoAtual ? 'step' : undefined} />)}</div><span className="ajuda-guia-teclas">Use A / D ou ← / → para navegar</span></div>
            <div className="ajuda-swipe-demo" key={`swipe-${sessaoGuia}`} aria-hidden="true"><span>Arraste</span><i>←</i></div>
          </section>
        </div>
      )}
    </main>
  );
}
