import { useCallback, useEffect, useRef, useState } from 'react';
import './Ajuda.css';

type CenaGuia =
  | 'inicio'
  | 'lista'
  | 'itens'
  | 'salvar'
  | 'comprar'
  | 'precos'
  | 'historico';

type PassoGuia = {
  titulo: string;
  texto: string;
  dica: string;
  cena: CenaGuia;
};

const PASSOS_GUIA: PassoGuia[] = [
  {
    titulo: 'Comece pela sua lista',
    texto:
      'Na página inicial, escolha Lista para preparar tudo o que pretende comprar antes de ir ao mercado.',
    dica: 'Você pode montar a lista com calma e continuar depois.',
    cena: 'inicio',
  },
  {
    titulo: 'Crie ou abra uma lista',
    texto:
      'Dê um nome para a compra, escolha a data se quiser se organizar e abra a lista para começar a adicionar os produtos.',
    dica: 'Use nomes fáceis de reconhecer, como “Compra do mês”.',
    cena: 'lista',
  },
  {
    titulo: 'Adicione seus produtos',
    texto:
      'Digite o produto, informe a quantidade e escolha a categoria. As sugestões ajudam a preencher itens comuns mais rápido.',
    dica: 'Os produtos ficam organizados por categoria para facilitar a compra.',
    cena: 'itens',
  },
  {
    titulo: 'Salve a lista',
    texto:
      'Quando terminar, salve a lista. Ela ficará disponível na área de Compras para você iniciar quando estiver no mercado.',
    dica: 'Se precisar alterar algo, você pode voltar à lista antes de começar a compra.',
    cena: 'salvar',
  },
  {
    titulo: 'Inicie a compra',
    texto:
      'Abra a lista em Compras e toque para iniciar. O sistema mostra os itens preparados e acompanha seu progresso.',
    dica: 'Marque cada item conforme ele entrar no carrinho.',
    cena: 'comprar',
  },
  {
    titulo: 'Informe preço e quantidade',
    texto:
      'Durante a compra, registre o preço e ajuste a quantidade quando necessário. O total é atualizado conforme você avança.',
    dica: 'Itens por quilo usam três casas decimais para deixar o peso mais preciso.',
    cena: 'precos',
  },
  {
    titulo: 'Consulte e reutilize seu histórico',
    texto:
      'Depois de finalizar, a compra vai para o Histórico. Lá você pode ver os itens comprados ou refazer a mesma lista sem copiar tudo de novo.',
    dica: 'Ao refazer uma compra, os preços antigos não são reaproveitados.',
    cena: 'historico',
  },
];

const PERGUNTAS = [
  {
    pergunta: 'Preciso estar conectado à internet para usar o site?',
    resposta:
      'Sim. Sua conta, listas e compras finalizadas são sincronizadas com segurança, então é necessário ter Wi-Fi ou dados móveis para acessar e salvar essas informações.',
  },
  {
    pergunta: 'Como começo uma nova lista de compras?',
    resposta:
      'Entre em Lista, crie uma nova lista, adicione os produtos desejados e salve. Depois ela aparecerá em Compras, pronta para ser iniciada.',
  },
  {
    pergunta: 'Posso adicionar um produto que não aparece nas sugestões?',
    resposta:
      'Pode. As sugestões servem apenas para agilizar o preenchimento. Se o produto não estiver no catálogo, digite o nome normalmente e escolha a categoria desejada.',
  },
  {
    pergunta: 'Como altero a quantidade de um item?',
    resposta:
      'Na criação da lista e durante a compra, use o campo de quantidade disponível para o item. Produtos por unidade aceitam números inteiros e produtos por peso usam quilogramas com três casas decimais.',
  },
  {
    pergunta: 'Como registro o preço durante a compra?',
    resposta:
      'Abra a compra em andamento e digite o preço no campo do item. O valor é formatado automaticamente em reais e o total da compra é recalculado conforme os preços são preenchidos.',
  },
  {
    pergunta: 'O que acontece se eu sair de uma compra antes de terminar?',
    resposta:
      'O progresso da compra em andamento fica salvo no navegador utilizado. Você pode sair para o catálogo ou consultar o histórico e depois voltar para continuar no mesmo dispositivo.',
  },
  {
    pergunta: 'Posso usar a mesma compra novamente?',
    resposta:
      'Sim. No Histórico, abra uma compra finalizada e escolha Refazer a mesma compra. Os itens, quantidades e unidades voltam para uma nova lista, mas os preços antigos não são copiados.',
  },
  {
    pergunta: 'Como vejo todos os itens de uma compra antiga?',
    resposta:
      'No Histórico, clique ou toque na compra desejada e escolha Ver itens da compra. Os produtos serão exibidos organizados por categoria.',
  },
  {
    pergunta: 'Posso usar minha conta em mais de um dispositivo?',
    resposta:
      'Sim. As listas e compras finalizadas são sincronizadas com sua conta. Apenas uma compra ainda não finalizada permanece no navegador em que foi iniciada.',
  },
  {
    pergunta: 'Como altero minha foto de perfil?',
    resposta:
      'Abra Minha conta e use o botão da câmera sobre o avatar. Você pode escolher uma nova foto, ajustar o enquadramento, trocar a imagem ou removê-la.',
  },
  {
    pergunta: 'Esqueci minha senha. O que faço?',
    resposta:
      'Na tela de acesso, utilize a opção de recuperação de senha. O sistema fará a verificação necessária antes de permitir a definição de uma nova senha.',
  },
  {
    pergunta: 'Por que uma categoria aparece como Outros?',
    resposta:
      'Itens antigos ou com uma categoria que não existe mais são enviados para Outros para que nenhum produto seja escondido ou perdido no histórico.',
  },
];

function IlustracaoGuia({ cena }: { cena: CenaGuia }) {
  return (
    <div className={`ajuda-mini-site ajuda-mini-site--${cena}`} aria-hidden="true">
      <div className="ajuda-mini-topo">
        <span className="ajuda-mini-logo">Liste & Compre</span>
        <span className="ajuda-mini-avatar">MC</span>
      </div>

      {cena === 'inicio' && (
        <div className="ajuda-mini-conteudo ajuda-mini-home">
          <div className="ajuda-mini-titulo">Organize sua compra</div>
          <div className="ajuda-mini-botao destaque">📝 Lista</div>
          <span className="ajuda-mini-seta">↓</span>
          <div className="ajuda-mini-botao">🛒 Compras</div>
          <span className="ajuda-mini-seta">↓</span>
          <div className="ajuda-mini-botao">📚 Histórico</div>
        </div>
      )}

      {cena === 'lista' && (
        <div className="ajuda-mini-conteudo">
          <div className="ajuda-mini-cabecalho-pagina">Nova lista</div>
          <div className="ajuda-mini-campo">Compra do mês</div>
          <div className="ajuda-mini-campo ajuda-mini-campo--curto">29/08/2026</div>
          <div className="ajuda-mini-acao">Criar lista</div>
        </div>
      )}

      {cena === 'itens' && (
        <div className="ajuda-mini-conteudo">
          <div className="ajuda-mini-cabecalho-pagina">Itens da lista</div>
          <div className="ajuda-mini-linha-item destaque">
            <span>Arroz</span><strong>2 un.</strong>
          </div>
          <div className="ajuda-mini-linha-item"><span>Leite</span><strong>6 un.</strong></div>
          <div className="ajuda-mini-linha-item"><span>Banana</span><strong>1,200 kg</strong></div>
          <div className="ajuda-mini-campo">Adicionar produto...</div>
        </div>
      )}

      {cena === 'salvar' && (
        <div className="ajuda-mini-conteudo ajuda-mini-centralizado">
          <div className="ajuda-mini-check">✓</div>
          <div className="ajuda-mini-cabecalho-pagina">Lista pronta!</div>
          <div className="ajuda-mini-texto">Seus itens foram organizados.</div>
          <div className="ajuda-mini-acao destaque">Salvar lista</div>
        </div>
      )}

      {cena === 'comprar' && (
        <div className="ajuda-mini-conteudo">
          <div className="ajuda-mini-cabecalho-pagina">Compras</div>
          <div className="ajuda-mini-compra-card destaque">
            <strong>Compra do mês</strong>
            <span>12 itens</span>
            <div className="ajuda-mini-acao">Iniciar compra</div>
          </div>
        </div>
      )}

      {cena === 'precos' && (
        <div className="ajuda-mini-conteudo">
          <div className="ajuda-mini-cabecalho-pagina">Compra em andamento</div>
          <div className="ajuda-mini-linha-preco destaque">
            <span>Arroz</span><span>R$ 24,90</span><span>2</span><b>✓</b>
          </div>
          <div className="ajuda-mini-linha-preco">
            <span>Banana</span><span>R$ 6,79</span><span>1,200</span><b>○</b>
          </div>
          <div className="ajuda-mini-total">Total: R$ 31,69</div>
        </div>
      )}

      {cena === 'historico' && (
        <div className="ajuda-mini-conteudo">
          <div className="ajuda-mini-cabecalho-pagina">Histórico</div>
          <div className="ajuda-mini-compra-card destaque">
            <strong>Compra do mês</strong>
            <span>R$ 286,40</span>
            <div className="ajuda-mini-acoes-duplas">
              <span>Refazer compra</span>
              <span>Ver itens</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Ajuda() {
  const [guiaAberto, setGuiaAberto] = useState(false);
  const [passoAtual, setPassoAtual] = useState(0);
  const [faqAberta, setFaqAberta] = useState<number | null>(null);
  const [sessaoGuia, setSessaoGuia] = useState(0);
  const toqueInicialX = useRef<number | null>(null);

  const abrirGuia = () => {
    setPassoAtual(0);
    setSessaoGuia((valor) => valor + 1);
    setGuiaAberto(true);
  };

  const fecharGuia = useCallback(() => {
    setGuiaAberto(false);
  }, []);

  const irAnterior = useCallback(() => {
    setPassoAtual((atual) => Math.max(0, atual - 1));
  }, []);

  const irProximo = useCallback(() => {
    setPassoAtual((atual) => Math.min(PASSOS_GUIA.length - 1, atual + 1));
  }, []);

  useEffect(() => {
    if (!guiaAberto) return;

    function controlarTeclado(evento: KeyboardEvent) {
      const alvo = evento.target;
      if (
        alvo instanceof Element &&
        alvo.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      const tecla = evento.key.toLowerCase();
      if (tecla === 'escape') {
        evento.preventDefault();
        fecharGuia();
        return;
      }

      if (!window.matchMedia('(min-width: 701px)').matches) return;

      if (tecla === 'a' || tecla === 'arrowleft') {
        evento.preventDefault();
        irAnterior();
      }

      if (tecla === 'd' || tecla === 'arrowright') {
        evento.preventDefault();
        irProximo();
      }
    }

    document.addEventListener('keydown', controlarTeclado);
    return () => document.removeEventListener('keydown', controlarTeclado);
  }, [fecharGuia, guiaAberto, irAnterior, irProximo]);

  const passo = PASSOS_GUIA[passoAtual];
  const primeiroPasso = passoAtual === 0;
  const ultimoPasso = passoAtual === PASSOS_GUIA.length - 1;

  return (
    <main className="ajuda-pagina">
      <section className="ajuda-cabecalho">
        <span className="ajuda-kicker">Central de ajuda</span>
        <h1>Como podemos ajudar?</h1>
        <p>Aprenda o básico do Liste & Compre ou encontre respostas rápidas para as dúvidas mais comuns.</p>
      </section>

      <button className="ajuda-guia-chamada" type="button" onClick={abrirGuia}>
        <span className="ajuda-guia-icone" aria-hidden="true">▶</span>
        <span>
          <strong>Aprenda a usar o Liste & Compre</strong>
          <small>Veja um passo a passo simples, do início ao histórico.</small>
        </span>
        <span className="ajuda-guia-abrir" aria-hidden="true">Abrir guia</span>
      </button>

      <section className="ajuda-faq" aria-labelledby="titulo-faq">
        <div className="ajuda-faq-titulo">
          <span className="ajuda-kicker">Perguntas frequentes</span>
          <h2 id="titulo-faq">Dúvidas comuns</h2>
          <p>Toque em uma pergunta para abrir ou fechar a resposta.</p>
        </div>

        <div className="ajuda-faq-lista">
          {PERGUNTAS.map((item, indice) => {
            const aberta = faqAberta === indice;
            return (
              <article className={`ajuda-faq-item${aberta ? ' aberta' : ''}`} key={item.pergunta}>
                <button
                  type="button"
                  className="ajuda-faq-pergunta"
                  aria-expanded={aberta}
                  aria-controls={`resposta-faq-${indice}`}
                  onClick={() => setFaqAberta(aberta ? null : indice)}
                >
                  <span>{item.pergunta}</span>
                  <span className="ajuda-faq-sinal" aria-hidden="true">{aberta ? '−' : '+'}</span>
                </button>
                <div
                  className="ajuda-faq-resposta-wrapper"
                  id={`resposta-faq-${indice}`}
                  aria-hidden={!aberta}
                >
                  <div className="ajuda-faq-resposta">
                    <p>{item.resposta}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {guiaAberto && (
        <div className="ajuda-guia-overlay" role="presentation">
          <section
            className="ajuda-guia-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ajuda-guia-titulo"
            onTouchStart={(evento) => {
              toqueInicialX.current = evento.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(evento) => {
              if (toqueInicialX.current === null) return;
              const finalX = evento.changedTouches[0]?.clientX ?? toqueInicialX.current;
              const deslocamento = finalX - toqueInicialX.current;
              toqueInicialX.current = null;
              if (Math.abs(deslocamento) < 55) return;
              if (deslocamento < 0) irProximo();
              if (deslocamento > 0) irAnterior();
            }}
          >
            <button className="ajuda-guia-fechar" type="button" onClick={fecharGuia} aria-label="Fechar guia">
              ×
            </button>

            <div className="ajuda-guia-progresso-texto">
              Passo {passoAtual + 1} de {PASSOS_GUIA.length}
            </div>

            <div className="ajuda-guia-corpo" key={passoAtual}>
              <IlustracaoGuia cena={passo.cena} />

              <div className="ajuda-guia-texto">
                <h2 id="ajuda-guia-titulo">{passo.titulo}</h2>
                <p>{passo.texto}</p>
                <div className="ajuda-guia-dica">
                  <span aria-hidden="true">💡</span>
                  <span>{passo.dica}</span>
                </div>
              </div>
            </div>

            <button
              className="ajuda-guia-seta ajuda-guia-seta--esquerda"
              type="button"
              onClick={irAnterior}
              disabled={primeiroPasso}
              aria-label="Voltar para o passo anterior"
            >
              ‹
            </button>
            <button
              className="ajuda-guia-seta ajuda-guia-seta--direita"
              type="button"
              onClick={irProximo}
              disabled={ultimoPasso}
              aria-label="Ir para o próximo passo"
            >
              ›
            </button>

            <div className="ajuda-guia-rodape">
              <div className="ajuda-guia-bolinhas" aria-label="Páginas do guia">
                {PASSOS_GUIA.map((item, indice) => (
                  <button
                    key={item.titulo}
                    type="button"
                    className={`ajuda-guia-bolinha${indice === passoAtual ? ' ativa' : ''}`}
                    onClick={() => setPassoAtual(indice)}
                    aria-label={`Ir para o passo ${indice + 1}: ${item.titulo}`}
                    aria-current={indice === passoAtual ? 'step' : undefined}
                  />
                ))}
              </div>
              <span className="ajuda-guia-teclas">Desktop: A / D ou ← / →</span>
            </div>

            <div className="ajuda-swipe-aviso" key={sessaoGuia} aria-hidden="true">
              <span className="ajuda-swipe-mao">☝</span>
              <span className="ajuda-swipe-trilha">arraste</span>
              <span className="ajuda-swipe-flecha">←</span>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
