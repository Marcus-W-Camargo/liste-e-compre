import { useState } from 'react';
import './Apoie.css';

const PIX_KEY = 'listeecompre@gmail.com';
const PORTFOLIO_PROJECTS_URL = 'https://marcuscamargo-portfolio.com.br/#projetos';
const PIX_CODE = '00020126440014BR.GOV.BCB.PIX0122listeecompre@gmail.com5204000053039865802BR5914LISTE E COMPRE6009SAO PAULO62070503***63041F07';
const PIX_CODE_PUBLIC_THANKS = '00020126440014BR.GOV.BCB.PIX0122listeecompre@gmail.com5204000053039865802BR5914LISTE E COMPRE6009SAO PAULO62170513AGRADECIMENTO63044519';

const QR_ROWS = [
  '11111110011000101100100010100110101111111','10000010111101010011110001110010001000001','10111010000010010111100100011010101011101','10111010011001000110010001100100001011101','10111010110001101010110101000011101011101','10000010010100000001010110111101101000001','11111110101010101010101010101010101111111','00000000001100100111111000100000000000000','10101010010101000100010110011000100010010','11011100111011011100000010100001010011010','01100010001111011011101001111110101010101','10101000111000011101011001110101010001001','11000011000111100010001111010010001100110','10001000111110111101011110000100000001010','01000111000110001110001111011100101101001','11100000111000001011010010110101001111011','01011111110001100110001110111000001010001','11100001101100101111000111101111010001011','00101010010010101010110010001001000010100','01101001000001011111000111011011101101001','11111111100111000010100001001110011011000','10001001100011100111010010010111011101010','11111010001011000110101001100001000001001','00100000111110011111010001100110001100110','10100110000000101001101100011010111010101','10001001010110000100010011100101010001010','11100010011101100010101000100110110000111','10011100101000101100101011101111010111001','01100111110101011011100111000111101110100','01100100011110010101100100100011010101101','10001110011001000001101010101011101101011','01100101000011101010101100011100010111010','10010110110100011011110011100100111110001','00000000111010100011011101100001100011000','11111110010001101100101001111011101011000','10000010011101110001011000111100100011001','10111010111111010000001000101000111111000','10111010001100011001011101001101011101100','10111010110111100010000000100000110011101','10000010001111011000110001100111011101011','11111110101111010010111001110100010110001',
] as const;

const QR_ROWS_PUBLIC_THANKS = [
  '11111110110001010100001011011010001111111','10000010110100100010000001000001101000001','10111010001001110100001111011111001011101','10111010111111001001001111100111001011101','10111010011111001100111011001101101011101','10000010001000000101001010100001101000001','11111110101010101010101010101010101111111','00000000111111010110001001010001100000000','10110111010110110111110101111011001001011','00010001101101011011000101100110010100010','11101010010001110101100111110000100100100','10110100110101000001000101101001001101010','10101011111100111010010111100010001100001','10001100101111100100101101110100110000100','10100111100001110101101010101111101110101','00110100111011000100010101100011001000011','11110011111011101001000000110110000100000','01111101100000110011001010110011001101000','01010010100011010010010010110001111010011','01011000101001001110101111001110011100111','01000010111110100001010011001101111000100','00101000001000011000011101110000011010010','01010111000001011000100111101111001111000','00101101000110000011001101111010010000101','10111110111000010001010100100010000010010','01111000110111110101100010010100100000100','00001111100111100001000011000101001011011','10010001101111001011110100101000010000001','00110011100010111101101011001001100000101','00101000101110010001011000111111001001110','10000110100111101001010010000011010101100','00110101110100010010111001110101100110100','01110110010111101000010000000111111111101','00000000111101100100011010100010100010000','11111110111110100010100110110001101011001','10000010111000101101001100000000100011010','10111010001110101000100001010000111111111','10111010110001110000101100111110101100010','10111010110010010001100011000011010000001','10000010001100010111110110100000011010011','11111110100001001100110111111010011000000',
] as const;

function PixQr({ publicThanks }: { publicThanks: boolean }) {
  const rows = publicThanks ? QR_ROWS_PUBLIC_THANKS : QR_ROWS;
  return (
    <div className="apoie-qr" aria-label="QR Code PIX para apoiar o projeto" role="img">
      {rows.map((row, rowIndex) => (
        <div className="apoie-qr-row" key={rowIndex}>
          {[...row].map((module, columnIndex) => (
            <span
              className={module === '1' ? 'apoie-qr-module apoie-qr-module--dark' : 'apoie-qr-module'}
              key={`${rowIndex}-${columnIndex}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

async function copiarTexto(texto: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(texto);
    return;
  }

  const area = document.createElement('textarea');
  area.value = texto;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

export function Apoie() {
  const [agradecimentoPublico, setAgradecimentoPublico] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const codigoPix = agradecimentoPublico ? PIX_CODE_PUBLIC_THANKS : PIX_CODE;

  async function copiarPix() {
    await copiarTexto(codigoPix);
    setCopiado(true);
  }

  function alternarAgradecimento() {
    setAgradecimentoPublico((atual) => !atual);
    setCopiado(false);
  }

  return (
    <main className="apoie-pagina">
      <section className="apoie-cabecalho">
        <span className="apoie-kicker">Projeto independente</span>
        <h1>Apoie-me</h1>
        <p>Ajude a manter este e futuros projetos independentes.</p>
      </section>

      <section className="apoie-card apoie-hero">
        <div className="apoie-coracao" aria-hidden="true">💛</div>
        <h2>O Liste & Compre continua gratuito e sem propagandas.</h2>
        <p>
          Se o app faz diferença na sua rotina e você quiser apoiar meu trabalho,
          sua contribuição ajuda na manutenção deste projeto e na criação de novas ideias.
        </p>
        <strong>O apoio é totalmente opcional e não altera nenhuma função do aplicativo.</strong>
      </section>

      <a
        className="apoie-projetos"
        href={PORTFOLIO_PROJECTS_URL}
        target="_blank"
        rel="noreferrer"
      >
        <span>
          <strong>Outros projetos</strong>
          <small>Conheça outros trabalhos e projetos que já publiquei.</small>
        </span>
        <b aria-hidden="true">↗</b>
      </a>

      <h2 className="apoie-secao-titulo">Apoiar via PIX</h2>
      <section className="apoie-card apoie-pix-card">
        <p className="apoie-intro-pix">
          Escolha qualquer valor no seu banco. Não existe valor mínimo ou sugerido.
        </p>
        <PixQr publicThanks={agradecimentoPublico} />
        <span className="apoie-chave-label">Chave PIX · E-mail</span>
        <strong className="apoie-chave">{PIX_KEY}</strong>
        <button className="apoie-botao-principal" type="button" onClick={() => void copiarPix()}>
          {copiado ? '✓ Código PIX copiado' : 'Copiar código PIX'}
        </button>
      </section>

      <h2 className="apoie-secao-titulo">Agradecimento público</h2>
      <section className="apoie-card">
        <label className="apoie-consentimento">
          <input
            type="checkbox"
            checked={agradecimentoPublico}
            onChange={alternarAgradecimento}
          />
          <span className="apoie-checkbox" aria-hidden="true">
            {agradecimentoPublico ? '✓' : ''}
          </span>
          <span>Aceito ter meu nome apresentado para agradecimentos no Instagram.</span>
        </label>
        <p className="apoie-aviso">
          Marcar esta opção não é necessário para apoiar. Quando marcada, o código PIX
          recebe uma identificação de autorização para o agradecimento.
        </p>
        <div className="apoie-observacao">
          <strong>Se quiser o agradecimento público</strong>
          <p>
            Coloque seu nome na Observação do PIX. Assim consigo identificar mais facilmente
            quem autorizou o agradecimento no Instagram do Liste & Compre.
          </p>
        </div>
      </section>

      <p className="apoie-rodape-texto">Obrigado por apoiar um projeto independente. 💛</p>
    </main>
  );
}
