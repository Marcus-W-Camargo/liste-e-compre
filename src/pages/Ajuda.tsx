import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import logoTitulo from '../assets/titulo.png';
import iconeLista from '../assets/Liste.png';
import './Ajuda.css';
import './AjudaRefino.css';

type CenaGuia =
  | 'inicio'
  | 'criar-lista'
  | 'adicionar-itens'
  | 'medida'
  | 'salvar-lista'
  | 'listas-salvas'
  | 'catalogo'
  | 'compra'
  | 'historico';

type PassoGuia = { titulo: string; texto: string; dica: string; cena: CenaGuia };

const PASSOS_GUIA: PassoGuia[] = [
  { titulo: 'Comece pela página inicial', texto: 'Na página inicial, toque em Lista para preparar os produtos antes de ir ao mercado.', dica: 'O fluxo principal segue Lista → Compras → Histórico.', cena: 'inicio' },
  { titulo: 'Abra a criação de lista', texto: 'Na tela Criar Lista, digite o produto, escolha a categoria, informe a quantidade e selecione a medida antes de adicionar o item.', dica: 'Você pode montar a lista aos poucos e revisar tudo antes de salvar.', cena: 'criar-lista' },
  { titulo: 'Adicione cada produto', texto: 'Conforme você digita, o sistema sugere produtos do catálogo. Você também pode usar um nome personalizado e escolher a categoria desejada.', dica: 'As categorias ajudam a manter os itens organizados durante a compra.', cena: 'adicionar-itens' },
  { titulo: 'Escolha entre unidade e quilo', texto: 'Use o botão de alternância da medida para informar se o produto será comprado por unidade ou por peso em quilogramas.', dica: '📦 representa unidade e ⚖️ representa quilo. Ao usar kg, a quantidade passa a aceitar três casas decimais.', cena: 'medida' },
  { titulo: 'Salve e dê um nome à lista', texto: 'Quando terminar, toque em Salvar Lista. O sistema abre o menu de nomeação acima da página para você identificar a lista.', dica: 'Use nomes fáceis de reconhecer, como “Compra do mês”.', cena: 'salvar-lista' },
  { titulo: 'Reabra ou renomeie listas salvas', texto: 'Na lateral da tela de Lista ficam as listas que você já salvou. Toque em uma delas para reabrir e continuar editando, ou use o lápis para mudar apenas o nome.', dica: 'Assim você pode reaproveitar uma lista sem precisar começar do zero.', cena: 'listas-salvas' },
  { titulo: 'Escolha a lista em Compras', texto: 'A lista salva aparece no catálogo de Compras. Toque no card para abrir as opções e então escolha se deseja iniciar ou agendar a compra.', dica: 'O próprio card abre as ações; basta tocar ou clicar nele.', cena: 'catalogo' },
  { titulo: 'Registre a compra em andamento', texto: 'Durante a compra, informe o preço, ajuste a medida ou a quantidade e acompanhe o total parcial conforme avança.', dica: 'O check fica à esquerda do item e é marcado automaticamente quando preço e quantidade estão preenchidos.', cena: 'compra' },
  { titulo: 'Consulte ou refaça pelo Histórico', texto: 'Depois de finalizar, a compra aparece no Histórico. Toque no card para abrir as ações e então escolha entre refazer a compra ou consultar seus itens.', dica: 'Ao refazer uma compra, os preços antigos não são reutilizados.', cena: 'historico' },
];

const PERGUNTAS = [
  { pergunta: 'Preciso estar conectado à internet para usar o site?', resposta: 'Sim. Sua conta, listas e compras finalizadas são sincronizadas com segurança, então é necessário ter Wi-Fi ou dados móveis para acessar e salvar essas informações.' },
  { pergunta: 'Como começo uma nova lista de compras?', resposta: 'Entre em Lista, adicione os produtos desejados e salve. Depois de nomeada, a lista aparecerá em Compras, pronta para ser iniciada.' },
  { pergunta: 'Posso adicionar um produto que não aparece nas sugestões?', resposta: 'Pode. As sugestões servem apenas para agilizar o preenchimento. Se o produto não estiver no catálogo, digite o nome normalmente e escolha a categoria desejada.' },
  { pergunta: 'Como altero a quantidade de um item?', resposta: 'Na criação da lista e durante a compra, use o campo de quantidade disponível para o item. Produtos por unidade aceitam números inteiros e produtos por peso usam quilogramas com três casas decimais.' },
  { pergunta: 'Como registro o preço durante a compra?', resposta: 'Abra a compra em andamento e digite o preço no campo do item. O valor é formatado automaticamente em reais e o total da compra é recalculado conforme os preços são preenchidos.' },
  { pergunta: 'O que acontece se eu sair de uma compra antes de terminar?', resposta: 'O progresso da compra em andamento fica salvo no navegador utilizado. Você pode sair para o catálogo ou consultar o histórico e depois voltar para continuar no mesmo dispositivo.' },
  { pergunta: 'Posso usar a mesma compra novamente?', resposta: 'Sim. No Histórico, abra uma compra finalizada e escolha Refazer a mesma compra. Os itens, quantidades e unidades voltam para uma nova lista, mas os preços antigos não são copiados.' },
  { pergunta: 'Como vejo todos os itens de uma compra antiga?', resposta: 'No Histórico, clique ou toque na compra desejada e escolha Ver itens da compra. Os produtos serão exibidos organizados por categoria.' },
  { pergunta: 'Posso usar minha conta em mais de um dispositivo?', resposta: 'Sim. As listas e compras finalizadas são sincronizadas com sua conta. Apenas uma compra ainda não finalizada permanece no navegador em que foi iniciada.' },
  { pergunta: 'Como altero minha foto de perfil?', resposta: 'Abra Minha conta e use o botão da câmera sobre o avatar. Você pode escolher uma nova foto, ajustar o enquadramento, trocar a imagem ou removê-la.' },
  { pergunta: 'Esqueci minha senha. O que faço?', resposta: 'Na tela de acesso, utilize a opção de recuperação de senha. O sistema fará a verificação necessária antes de permitir a definição de uma nova senha.' },
  { pergunta: 'Por que uma categoria aparece como Outros?', resposta: 'Itens antigos ou com uma categoria que não existe mais são enviados para Outros para que nenhum produto seja escondido ou perdido no histórico.' },
];

function IconeUsuarioPadrao() {
  return <span className="ajuda-mini-usuario" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#1a263b" /></svg></span>;
}

function MolduraSite({ children }: { children: ReactNode }) {
  return <div className="ajuda-mini-site" aria-hidden="true"><div className="ajuda-mini-cabecalho"><img src={logoTitulo} alt="" /><div className="ajuda-mini-conta"><span>Olá, Marcus.</span><IconeUsuarioPadrao /></div></div><div className="ajuda-mini-area">{children}</div></div>;
}

function SwitchMedidaMini({ kg = false }: { kg?: boolean }) {
  return <div className={`ajuda-switch-real${kg ? ' kg' : ''}`}><span className="ajuda-switch-bola" /><span className="ajuda-switch-un">📦</span><span className="ajuda-switch-kg">⚖️</span></div>;
}

function FormularioMini({ sugestoes = false, kg = false, compacto = false }: { sugestoes?: boolean; kg?: boolean; compacto?: boolean }) {
  return <div className={`ajuda-form-real${compacto ? ' ajuda-form-compacto' : ''}`}>
    <label>Nome do Produto</label>
    <div className={`ajuda-input-real${sugestoes ? ' ajuda-input-ativo' : ''}`}>{sugestoes ? 'Arroz' : 'Ex: Arroz, Feijão, Sabonete...'}</div>
    {sugestoes && <div className="ajuda-sugestoes-real"><span>Arroz Agulhinha</span><span>Arroz Branco</span><span>Arroz Integral</span></div>}
    <div className="ajuda-linha-form-real">
      <div><label>Categoria</label><div className="ajuda-input-real">🍞 Mercearia ▾</div></div>
      <div><label>Quantidade</label><div className="ajuda-input-real">{kg ? '1,200' : '2'}</div></div>
      <div className="ajuda-medida-form"><label>Medida <span>({kg ? 'kg.' : 'un.'})</span></label><SwitchMedidaMini kg={kg} /></div>
    </div>
    <div className="ajuda-botao-laranja">Adicionar à Lista</div>
  </div>;
}

function CursorAnimado({ className = '' }: { className?: string }) {
  return <span className={`ajuda-cursor-demo ${className}`} aria-hidden="true"><i /></span>;
}

function IlustracaoGuia({ cena }: { cena: CenaGuia }) {
  if (cena === 'inicio') return <MolduraSite><div className="ajuda-ilustra-home"><img className="ajuda-ilustra-logo" src={logoTitulo} alt="" /><div className="ajuda-home-botao ajuda-destaque">Lista <span>📝</span></div><span className="ajuda-home-seta">↓</span><div className="ajuda-home-botao">Compras <span>🛒</span></div><span className="ajuda-home-seta">↓</span><div className="ajuda-home-botao">Histórico <span>📚</span></div></div></MolduraSite>;

  if (cena === 'criar-lista') return <MolduraSite><div className="ajuda-ilustra-pagina"><div className="ajuda-titulo-lista-real"><img src={iconeLista} alt="" /><strong>Criar Lista</strong></div><FormularioMini /></div></MolduraSite>;

  if (cena === 'adicionar-itens') return <MolduraSite><div className="ajuda-ilustra-pagina"><div className="ajuda-titulo-lista-real"><img src={iconeLista} alt="" /><strong>Criar Lista</strong></div><FormularioMini sugestoes /></div></MolduraSite>;

  if (cena === 'medida') return <MolduraSite><div className="ajuda-ilustra-pagina ajuda-medida-pagina"><div className="ajuda-titulo-lista-real"><img src={iconeLista} alt="" /><strong>Criar Lista</strong></div><div className="ajuda-medida-comparacao"><div><span>Por unidade</span><strong>2</strong><SwitchMedidaMini /></div><div className="ativo"><span>Por quilo</span><strong>1,200</strong><SwitchMedidaMini kg /></div></div><div className="ajuda-medida-legenda"><span>📦 Unidade</span><span>⚖️ Quilograma</span></div></div></MolduraSite>;

  if (cena === 'salvar-lista') return <MolduraSite><div className="ajuda-ilustra-pagina ajuda-cena-animada ajuda-cena-salvar"><div className="ajuda-lista-itens-real"><div><span>Arroz</span><b>2 un.</b></div><div><span>Leite</span><b>6 un.</b></div><div><span>Banana</span><b>1,200 kg</b></div></div><div className="ajuda-salvar-alvo"><div className="ajuda-botao-laranja ajuda-botao-salvar-demo">Salvar Lista</div><CursorAnimado className="ajuda-cursor-salvar" /></div><div className="ajuda-mini-overlay-demo" /><div className="ajuda-modal-nome-real"><strong>💾 Nomear sua lista</strong><span>Dê um nome para identificar essa lista.</span><div className="ajuda-input-real">Compra do mês</div><div className="ajuda-botao-laranja">Confirmar e salvar</div><button type="button">Voltar</button></div></div></MolduraSite>;

  if (cena === 'listas-salvas') return <MolduraSite><div className="ajuda-ilustra-pagina ajuda-cena-listas-salvas ajuda-listas-sem-animacao"><aside className="ajuda-painel-listas-real"><h3>📋 Minhas Listas</h3><div className="ajuda-lista-lateral-demo ajuda-destaque"><div><div className="ajuda-nome-lateral"><strong>Compra do mês</strong><span>✏️</span></div><small>3 itens</small><em>Modificada em 29/08/2026</em></div><b>🗑️</b></div><div className="ajuda-lista-lateral-demo"><div><div className="ajuda-nome-lateral"><strong>Churrasco</strong><span>✏️</span></div><small>8 itens</small><em>Modificada em 27/08/2026</em></div><b>🗑️</b></div></aside><div className="ajuda-lista-edicao-demo"><div className="ajuda-titulo-lista-real"><img src={iconeLista} alt="" /><strong>Criar Lista</strong></div><FormularioMini compacto /></div></div></MolduraSite>;

  if (cena === 'catalogo') return <MolduraSite><div className="ajuda-ilustra-pagina ajuda-cena-animada ajuda-cena-catalogo"><h3 className="ajuda-catalogo-titulo"><span>Suas</span>Compras</h3><div className="ajuda-card-compra-real"><strong>Compra do mês</strong><span>12 itens</span><small>29/08/2026</small></div><CursorAnimado className="ajuda-cursor-catalogo" /><div className="ajuda-menu-compra-real"><div>Iniciar compra <b>›</b></div><span>Escolha uma ação</span><div>Agendar compra <b>›</b></div></div></div></MolduraSite>;

  if (cena === 'compra') return <MolduraSite><div className="ajuda-ilustra-pagina ajuda-compra-real"><div className="ajuda-topo-compra-real"><div><img src={iconeLista} alt="" /><strong>Compra do mês</strong></div><span>50% concluída</span><b>Total parcial: R$ 31,69</b></div><div className="ajuda-secao-compra-real"><div className="ajuda-secao-titulo"><strong>Geral (Todos)</strong><span>2 Itens ▲</span></div><div className="ajuda-linha-compra-real ajuda-destaque"><span className="ajuda-check-quadrado marcado">✓</span><span className="ajuda-icone-item">🍞</span><strong>Arroz</strong><div className="ajuda-campo-tracejado">R$ <b>24,90</b></div><div className="ajuda-medida-demo"><span>Un.</span><SwitchMedidaMini /></div><div className="ajuda-campo-tracejado">2</div><span className="ajuda-total-item">R$ 49,80</span><span className="ajuda-lixo-demo">⌫</span></div><div className="ajuda-linha-compra-real"><span className="ajuda-check-quadrado" /><span className="ajuda-icone-item">🍎</span><strong>Banana</strong><div className="ajuda-campo-tracejado">R$ <b>6,79</b></div><div className="ajuda-medida-demo"><span>Kg.</span><SwitchMedidaMini kg /></div><div className="ajuda-campo-tracejado">1,200</div><span className="ajuda-total-item">R$ 8,15</span><span className="ajuda-lixo-demo">⌫</span></div></div></div></MolduraSite>;

  return <MolduraSite><div className="ajuda-ilustra-pagina ajuda-cena-animada ajuda-cena-historico"><div className="ajuda-historico-topo-demo"><div><span>Seu</span><h3>Histórico</h3></div><strong>2 compras</strong></div><div className="ajuda-card-historico-real"><div><strong>Compra do mês</strong><p>29/08/2026</p><small>Extras: R$ 12,50</small></div><b>R$ 286,40</b></div><CursorAnimado className="ajuda-cursor-historico" /><div className="ajuda-mini-overlay-demo" /><div className="ajuda-modal-historico-real"><span className="ajuda-icone-modal-historico">🧾</span><strong>O que deseja fazer?</strong><p>Escolha uma ação para esta compra.</p><div className="ajuda-botao-laranja">↻ Refazer a mesma compra</div><div className="ajuda-botao-secundario">📋 Ver itens da compra</div><div className="ajuda-botao-secundario ajuda-cancelar-demo">Cancelar</div></div></div></MolduraSite>;
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

  return <main className="ajuda-pagina">
    <section className="ajuda-cabecalho"><span className="ajuda-kicker">Central de ajuda</span><h1>Como podemos ajudar?</h1><p>Aprenda o básico do Liste & Compre ou encontre respostas rápidas para as dúvidas mais comuns.</p></section>
    <button className="ajuda-guia-chamada" type="button" onClick={abrirGuia}><span className="ajuda-guia-icone" aria-hidden="true">▶</span><span><strong>Aprenda a usar o Liste & Compre</strong><small>Veja um passo a passo simples, do início ao histórico.</small></span><span className="ajuda-guia-abrir" aria-hidden="true">Abrir guia</span></button>
    <section className="ajuda-faq" aria-labelledby="titulo-faq"><div className="ajuda-faq-titulo"><span className="ajuda-kicker">Perguntas frequentes</span><h2 id="titulo-faq">Dúvidas comuns</h2><p>Toque em uma pergunta para abrir ou fechar a resposta.</p></div><div className="ajuda-faq-lista">{PERGUNTAS.map((item, indice) => { const aberta = faqAberta === indice; return <article className={`ajuda-faq-item${aberta ? ' aberta' : ''}`} key={item.pergunta}><button type="button" className="ajuda-faq-pergunta" aria-expanded={aberta} aria-controls={`resposta-faq-${indice}`} onClick={() => setFaqAberta(aberta ? null : indice)}><span>{item.pergunta}</span><span className="ajuda-faq-sinal" aria-hidden="true">{aberta ? '−' : '+'}</span></button><div className="ajuda-faq-resposta-wrapper" id={`resposta-faq-${indice}`} aria-hidden={!aberta}><div className="ajuda-faq-resposta"><p>{item.resposta}</p></div></div></article>; })}</div></section>

    {guiaAberto && <div className="ajuda-guia-overlay" role="presentation"><section className="ajuda-guia-modal" role="dialog" aria-modal="true" aria-label="Guia de uso do Liste & Compre" onTouchStart={(evento) => { toqueInicialX.current = evento.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(evento) => { if (toqueInicialX.current === null) return; const fim = evento.changedTouches[0]?.clientX ?? toqueInicialX.current; const delta = fim - toqueInicialX.current; toqueInicialX.current = null; if (Math.abs(delta) < 45) return; if (delta < 0 && !ultimoPasso) irProximo(); if (delta > 0 && !primeiroPasso) irAnterior(); }}>
      <button className="ajuda-guia-fechar" type="button" onClick={fecharGuia} aria-label="Fechar guia"><span aria-hidden="true">×</span></button>
      <div className="ajuda-guia-progresso-texto">Passo {passoAtual + 1} de {PASSOS_GUIA.length}</div>
      <button className="ajuda-guia-seta ajuda-guia-seta--esquerda" type="button" onClick={irAnterior} disabled={primeiroPasso} aria-label="Passo anterior">‹</button>
      <div className="ajuda-guia-corpo" key={`${sessaoGuia}-${passoAtual}`}><div className="ajuda-guia-ilustracao"><IlustracaoGuia cena={passo.cena} /></div><div className="ajuda-guia-texto"><h2>{passo.titulo}</h2><p>{passo.texto}</p><div className="ajuda-guia-dica"><span aria-hidden="true">💡</span><span>{passo.dica}</span></div></div></div>
      <button className="ajuda-guia-seta ajuda-guia-seta--direita" type="button" onClick={irProximo} disabled={ultimoPasso} aria-label="Próximo passo">›</button>
      <div className="ajuda-guia-rodape"><div className="ajuda-guia-bolinhas" aria-label="Etapas do guia">{PASSOS_GUIA.map((item, indice) => <button key={item.titulo} type="button" className={`ajuda-guia-bolinha${indice === passoAtual ? ' ativa' : ''}`} onClick={() => setPassoAtual(indice)} aria-label={`Ir para o passo ${indice + 1}`} aria-current={indice === passoAtual ? 'step' : undefined} />)}</div><span className="ajuda-guia-teclas">Use A / D ou ← / → para navegar</span></div>
      <div className="ajuda-swipe-demo" key={`swipe-${sessaoGuia}`} aria-hidden="true"><span>Arraste</span><i>←</i></div>
    </section></div>}
  </main>;
}
