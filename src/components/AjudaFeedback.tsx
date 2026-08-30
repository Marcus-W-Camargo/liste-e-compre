import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import './AjudaFeedback.css';

type TipoFeedback = 'Elogio' | 'Reclamação' | 'Bug';

type OpcaoFeedback = {
  tipo: TipoFeedback;
  icone: string;
  titulo: string;
  descricao: string;
  placeholder: string;
};

const OPCOES: OpcaoFeedback[] = [
  {
    tipo: 'Elogio',
    icone: '💙',
    titulo: 'Fazer um elogio',
    descricao: 'Conte o que você gostou no Liste & Compre.',
    placeholder: 'Conte para a gente o que você gostou...',
  },
  {
    tipo: 'Reclamação',
    icone: '💬',
    titulo: 'Fazer uma reclamação',
    descricao: 'Diga o que não funcionou bem ou pode melhorar.',
    placeholder: 'Explique o que aconteceu e como podemos melhorar...',
  },
  {
    tipo: 'Bug',
    icone: '🐞',
    titulo: 'Reportar um bug',
    descricao: 'Avise sobre um erro ou comportamento inesperado.',
    placeholder: 'Descreva o problema e, se possível, o que você fazia quando ele aconteceu...',
  },
];

export function AjudaFeedback() {
  const [destino, setDestino] = useState<HTMLElement | null>(null);
  const [opcao, setOpcao] = useState<OpcaoFeedback | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [status, setStatus] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    const pagina = document.querySelector('.ajuda-pagina');
    const cabecalho = document.querySelector('.ajuda-cabecalho');
    if (!(pagina instanceof HTMLElement) || !(cabecalho instanceof HTMLElement)) return;

    const paragrafo = cabecalho.querySelector('p');
    const textoAnterior = paragrafo?.textContent ?? '';
    if (paragrafo) {
      paragrafo.textContent = 'Veja o passo a passo do Liste & Compre, encontre respostas para as dúvidas mais comuns ou fale com a gente para enviar um elogio, uma reclamação ou reportar um problema.';
    }

    const ponto = document.createElement('div');
    ponto.className = 'ajuda-feedback-ponto';
    cabecalho.insertAdjacentElement('afterend', ponto);
    setDestino(ponto);

    return () => {
      if (paragrafo) paragrafo.textContent = textoAnterior;
      ponto.remove();
    };
  }, []);

  useEffect(() => {
    if (!opcao) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && !enviando) setOpcao(null);
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [enviando, opcao]);

  function abrirFormulario(item: OpcaoFeedback) {
    setOpcao(item);
    setMensagem('');
    setEmail('');
    setStatus(null);
  }

  function fecharFormulario() {
    if (enviando) return;
    setOpcao(null);
    setStatus(null);
  }

  async function enviarFeedback(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!opcao || !mensagem.trim() || enviando) return;

    setEnviando(true);
    setStatus(null);

    try {
      const resposta = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: opcao.tipo,
          mensagem: mensagem.trim(),
          email: email.trim(),
          pagina: window.location.pathname,
          navegador: navigator.userAgent,
        }),
      });

      const resultado = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(resultado?.error || 'Não foi possível enviar sua mensagem.');

      setMensagem('');
      setStatus({ tipo: 'sucesso', texto: 'Mensagem enviada. Obrigado por falar com a gente!' });
    } catch (erro) {
      setStatus({
        tipo: 'erro',
        texto: erro instanceof Error ? erro.message : 'Não foi possível enviar sua mensagem agora.',
      });
    } finally {
      setEnviando(false);
    }
  }

  if (!destino) return null;

  return createPortal(
    <>
      <section className="ajuda-feedback" aria-labelledby="titulo-feedback">
        <div className="ajuda-feedback-titulo">
          <span className="ajuda-kicker">Fale com a gente</span>
          <h2 id="titulo-feedback">Quer nos contar alguma coisa?</h2>
          <p>Escolha uma opção e envie sua mensagem sem sair da Central de Ajuda.</p>
        </div>

        <div className="ajuda-feedback-opcoes">
          {OPCOES.map((item) => (
            <button key={item.tipo} type="button" className="ajuda-feedback-card" onClick={() => abrirFormulario(item)}>
              <span className="ajuda-feedback-icone" aria-hidden="true">{item.icone}</span>
              <span className="ajuda-feedback-card-texto">
                <strong>{item.titulo}</strong>
                <small>{item.descricao}</small>
              </span>
              <span className="ajuda-feedback-seta" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </section>

      {opcao && (
        <div className="ajuda-feedback-overlay" role="presentation" onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget) fecharFormulario();
        }}>
          <section className="ajuda-feedback-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-feedback">
            <button type="button" className="ajuda-feedback-fechar" onClick={fecharFormulario} aria-label="Fechar formulário">×</button>
            <div className="ajuda-feedback-modal-icone" aria-hidden="true">{opcao.icone}</div>
            <span className="ajuda-kicker">{opcao.tipo === 'Bug' ? 'Reportar problema' : opcao.tipo}</span>
            <h2 id="titulo-modal-feedback">{opcao.titulo}</h2>
            <p className="ajuda-feedback-modal-intro">Sua mensagem será enviada diretamente para a equipe do Liste & Compre.</p>

            <form onSubmit={enviarFeedback}>
              <label htmlFor="feedback-mensagem">Sua mensagem</label>
              <textarea
                id="feedback-mensagem"
                value={mensagem}
                onChange={(evento) => setMensagem(evento.target.value)}
                placeholder={opcao.placeholder}
                maxLength={5000}
                required
                autoFocus
              />
              <div className="ajuda-feedback-contador">{mensagem.length}/5000</div>

              <label htmlFor="feedback-email">E-mail para contato <span>(opcional)</span></label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="seuemail@exemplo.com"
                maxLength={254}
              />

              {opcao.tipo === 'Bug' && (
                <div className="ajuda-feedback-diagnostico">
                  <span aria-hidden="true">ℹ️</span>
                  <p>A página atual e informações básicas do navegador serão incluídas para ajudar na investigação do problema.</p>
                </div>
              )}

              {status && <div className={`ajuda-feedback-status ${status.tipo}`} role="status">{status.texto}</div>}

              <button className="ajuda-feedback-enviar" type="submit" disabled={enviando || !mensagem.trim()}>
                {enviando ? 'Enviando...' : 'Enviar mensagem'}
              </button>
            </form>
          </section>
        </div>
      )}
    </>,
    destino,
  );
}
