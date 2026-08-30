import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import logoTitulo from '../assets/titulo.png';
import iconeLista from '../assets/Liste.png';
import './Ajuda.css';

type CenaGuia =
  | 'inicio'
  | 'criar-lista'
  | 'adicionar-itens'
  | 'salvar-lista'
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
  { titulo: 'Comece pela página inicial', texto: 'Na página inicial, toque em Lista para preparar os produtos antes de ir ao mercado.', dica: 'O fluxo principal segue Lista → Compras → Histórico.', cena: 'inicio' },
  { titulo: 'Abra a criação de lista', texto: 'Na tela Criar Lista, você prepara os produtos que deseja comprar. O formulário mantém o mesmo visual e organização usados no sistema.', dica: 'Você pode montar a lista aos poucos e revisar os itens antes de salvar.', cena: 'criar-lista' },
  { titulo: 'Adicione cada produto', texto: 'Digite o nome, informe a quantidade e escolha a categoria. As sugestões aparecem conforme você digita, mas também é possível cadastrar um nome personalizado.', dica: 'As categorias ajudam a manter os itens organizados durante a compra.', cena: 'adicionar-itens' },
  { titulo: 'Salve e dê um nome à lista', texto: 'Quando terminar, use Salvar Lista. O sistema pede um nome para identificar essa compra e guardar os itens para depois.', dica: 'Use nomes fáceis de reconhecer, como “Compra do mês”.', cena: 'salvar-lista' },
  { titulo: 'Escolha a lista em Compras', texto: 'A lista salva aparece no catálogo de Compras. Toque no card e escolha a ação para iniciar quando estiver no mercado.', dica: 'O card da lista é branco; o menu de ações usa o azul e o laranja do site.', cena: 'catalogo' },
  { titulo: 'Registre a compra em andamento', texto: 'Durante a compra, informe os preços e ajuste as quantidades. O sistema acompanha os itens e atualiza o total conforme você avança.', dica: 'Produtos por quilo usam três casas decimais para registrar o peso.', cena: 'compra' },
  { titulo: 'Consulte ou refaça pelo Histórico', texto: 'Depois de finalizar, a compra aparece no Histórico. Abra o card para ver os itens ou refazer a mesma compra sem digitar tudo novamente.', dica: 'Ao refazer uma compra, os preços antigos não são reutilizados.', cena: 'historico' },
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
  return <span className="ajuda-mini-usuario" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#1a263b" /></svg></span>;
}

function MolduraSite({ children }: { children: ReactNode }) {
  return <div className="ajuda-mini-site" aria-hidden="true"><div className="ajuda-mini-cabecalho"><img src={logoTitulo} alt="" /><div className="ajuda-mini-conta"><span>Olá, Marcus.</span><IconeUsuarioPadrao /></div></div><div className="ajuda-mini-area">{children}</div></div>;
}

function IlustracaoGuia({ cena }: { cena: CenaGuia }) {
  if (cena === 'inicio') return <MolduraSite><div className="ajuda-ilustra-home"><img className="ajuda-ilustra-logo" src={logoTitulo} alt="" /><div className="ajuda-home-botao ajuda-destaque">Lista <span>📝</span></div><span className="ajuda-home-seta">↓</span><div className="ajuda-home-botao">Compras <span>🛒</span></div><span className="ajuda-home-seta">↓</span><div className="ajuda-home-botao">Histórico <span>📚</span></div></div></MolduraSite>;
  if (cena === 'criar-lista') return <MolduraSite><div className="ajuda-ilustra-pagina"><div className="ajuda-titulo-lista-real"><img src={iconeLista} alt="" /><strong>Criar Lista</strong></div><div className="ajuda-form-real ajuda-destaque"><label>Produto</label><div className="ajuda-input-real">Digite um produto...</div><div className="ajuda-dupla-real"><div><label>Quantidade</label><div className="ajuda-input-real">1</div></div><div><label>Categoria</label><div className="ajuda-input-real">Mercearia ▾</div></div></div><div className="ajuda-botao-laranja">Adicionar item</div></div></div></MolduraSite>;
  if (cena === 'adicionar-itens') return <MolduraSite><div className="ajuda-ilustra-pagina"><div className="ajuda-titulo-lista-real"><img src={iconeLista} alt="" /><strong>Criar Lista</strong></div><div className="ajuda-form-real ajuda-destaque"><label>Produto</label><div className="ajuda-input-real ajuda-input-ativo">Arroz</div><div className="ajuda-sugestoes-real"><span>Arroz Agulhinha</span><span>Arroz Branco</span><span>Arroz Integral</span></div><div className="ajuda-dupla-real"><div><label>Quantidade</label><div className="ajuda-input-real">2</div></div><div><label>Categoria</label><div className="ajuda-input-real">Mercearia ▾</div></div></div></div></div></MolduraSite>;
  if (cena === 'salvar-lista') return <MolduraSite><div className="ajuda-ilustra-pagina ajuda-ilustra-salvar"><div className="ajuda-lista-itens-real"><div><span>Arroz</span><b>2 un.</b></div><div><span>Leite</span><b>6 un.</b></div><div><span>Banana</span><b>1,200 kg</b></div></div><div className="ajuda-botao-laranja ajuda-destaque">Salvar Lista</div><div className="ajuda-modal-nome-real"><strong>💾 Nomear sua lista</strong><span>Dê um nome para identificar essa lista.</span><div className="ajuda-input-real">Compra do mês</div><div className="ajuda-botao-laranja">Confirmar e salvar</div></div></div></MolduraSite>;
  if (cena === 'catalogo') return <MolduraSite><div className="ajuda-ilustra-pagina"><h3 className="ajuda-catalogo-titulo"><span>Suas</span>Compras</h3><div className="ajuda-card-compra-real ajuda-destaque"><strong>Compra do mês</strong><span>12 itens</span><small>29/08/2026</small></div><div className="ajuda-menu-compra-real"><div>Iniciar compra <b>›</b></div><span>Escolha uma ação</span><div>Agendar compra <b>›</b></div></div></div></MolduraSite>;
  if (cena === 'compra') return <MolduraSite><div className="ajuda-ilustra-pagina"><h3 className="ajuda-compra-titulo">Compra em andamento</h3><div className="ajuda-linha-compra-real ajuda-destaque"><span className="ajuda-item-nome">Arroz</span><div className="ajuda-campo-preco">24,90</div><div className="ajuda-campo-qtd">2</div><div className="ajuda-check-real">✓</div></div><div className="ajuda-linha-compra-real"><span className="ajuda-item-nome">Banana</span><div className="ajuda-campo-preco">6,79</div><div className="ajuda-campo-qtd">1,200</div><div className="ajuda-check-real vazio">✓</div></div><div className="ajuda-total-real">Total: R$ 31,69</div></div></MolduraSite>;
  return <MolduraSite><div className="ajuda-ilustra-pagina"><h3 className="ajuda-catalogo-titulo"><span>Seu</span>Histórico</h3><div className="ajuda-card-historico-real ajuda-destaque"><div><strong>Compra do mês</strong><b>R$ 286,40</b></div><span>29/08/2026</span><small>Extras: R$ 12,50</small></div><div className="ajuda-menu-historico-real"><div>Refazer a mesma compra <b>›</b></div><div>Ver itens da compra <b>›</b></div></div></div></MolduraSite>;
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

    {guiaAberto && <div className="ajuda-guia-overlay" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) fecharGuia(); }}><section className="ajuda-guia-modal" role="dialog" aria-modal="true" aria-label="Guia de uso do Liste & Compre" onTouchStart={(evento) => { toqueInicialX.current = evento.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(evento) => { if (toqueInicialX.current === null) return; const finalX = evento.changedTouches[0]?.clientX ?? toqueInicialX.current; const distancia = finalX - toqueInicialX.current; toqueInicialX.current = null; if (Math.abs(distancia) < 45) return; if (distancia < 0 && !ultimoPasso) irProximo(); if (distancia > 0 && !primeiroPasso) irAnterior(); }}>
      <button className="ajuda-guia-fechar" type="button" onClick={fecharGuia} aria-label="Fechar guia">×</button>
      <div className="ajuda-guia-progresso-texto">Passo {passoAtual + 1} de {PASSOS_GUIA.length}</div>
      <button className="ajuda-guia-seta ajuda-guia-seta--esquerda" type="button" onClick={irAnterior} disabled={primeiroPasso} aria-label="Passo anterior">‹</button>
      <div className="ajuda-guia-janela"><article className="ajuda-slide-card" key={`${passoAtual}-${passo.cena}`}><div className="ajuda-slide-ilustracao"><IlustracaoGuia cena={passo.cena} /></div><div className="ajuda-slide-texto"><h2>{passo.titulo}</h2><p>{passo.texto}</p><div className="ajuda-guia-dica"><span aria-hidden="true">💡</span><span>{passo.dica}</span></div></div></article></div>
      <button className="ajuda-guia-seta ajuda-guia-seta--direita" type="button" onClick={irProximo} disabled={ultimoPasso} aria-label="Próximo passo">›</button>
      <div className="ajuda-guia-rodape"><div className="ajuda-guia-bolinhas" aria-label="Etapas do guia">{PASSOS_GUIA.map((item, indice) => <button key={item.titulo} type="button" className={`ajuda-guia-bolinha${indice === passoAtual ? ' ativa' : ''}`} onClick={() => setPassoAtual(indice)} aria-label={`Ir para o passo ${indice + 1}: ${item.titulo}`} aria-current={indice === passoAtual ? 'step' : undefined} />)}</div><small className="ajuda-guia-teclas">Use A / D ou ← / → para navegar</small></div>
      <div className="ajuda-swipe-dica" key={sessaoGuia} aria-hidden="true"><span className="ajuda-swipe-mao">☝</span><span>arraste</span><b>←</b></div>
    </section></div>}
  </main>;
}
