import {
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { carregarFotoPerfil, salvarFotoPerfil } from '../utils/profilePhoto';

const TAMANHO_RECORTE = 280;
const TAMANHO_SAIDA = 512;
const TAMANHO_MAXIMO_ARQUIVO = 15 * 1024 * 1024;
const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/jpg', 'image/png']);

interface ImagemSelecionada {
  id: string;
  src: string;
  largura: number;
  altura: number;
}

interface Posicao {
  x: number;
  y: number;
}

interface EditorRecorteFotoProps {
  imagem: ImagemSelecionada;
  onCancelar: () => void;
  onEscolherOutra: () => void;
  onSalvar: (foto: string) => void;
}

function lerArquivoComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () =>
      typeof leitor.result === 'string'
        ? resolve(leitor.result)
        : reject(new Error('Não foi possível ler esta imagem.'));
    leitor.onerror = () => reject(new Error('Não foi possível ler esta imagem.'));
    leitor.readAsDataURL(arquivo);
  });
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error('A imagem selecionada não pôde ser aberta.'));
    imagem.src = src;
  });
}

function limitarPosicao(
  posicao: Posicao,
  zoom: number,
  imagem: ImagemSelecionada,
): Posicao {
  const escalaBase = TAMANHO_RECORTE / Math.min(imagem.largura, imagem.altura);
  const escala = escalaBase * zoom;
  const limiteX = Math.max(0, (imagem.largura * escala - TAMANHO_RECORTE) / 2);
  const limiteY = Math.max(0, (imagem.altura * escala - TAMANHO_RECORTE) / 2);

  return {
    x: Math.max(-limiteX, Math.min(limiteX, posicao.x)),
    y: Math.max(-limiteY, Math.min(limiteY, posicao.y)),
  };
}

async function criarFotoRecortada(
  imagemSelecionada: ImagemSelecionada,
  zoom: number,
  posicao: Posicao,
): Promise<string> {
  const imagem = await carregarImagem(imagemSelecionada.src);
  const escalaBase = TAMANHO_RECORTE /
    Math.min(imagemSelecionada.largura, imagemSelecionada.altura);
  const escala = escalaBase * zoom;
  const larguraExibida = imagemSelecionada.largura * escala;
  const alturaExibida = imagemSelecionada.altura * escala;
  const esquerda = (TAMANHO_RECORTE - larguraExibida) / 2 + posicao.x;
  const topo = (TAMANHO_RECORTE - alturaExibida) / 2 + posicao.y;
  const origemX = -esquerda / escala;
  const origemY = -topo / escala;
  const tamanhoOrigem = TAMANHO_RECORTE / escala;
  const canvas = document.createElement('canvas');
  canvas.width = TAMANHO_SAIDA;
  canvas.height = TAMANHO_SAIDA;
  const contexto = canvas.getContext('2d');

  if (!contexto) throw new Error('Não foi possível preparar o recorte.');

  contexto.fillStyle = '#fff';
  contexto.fillRect(0, 0, TAMANHO_SAIDA, TAMANHO_SAIDA);
  contexto.imageSmoothingEnabled = true;
  contexto.imageSmoothingQuality = 'high';
  contexto.drawImage(
    imagem,
    origemX,
    origemY,
    tamanhoOrigem,
    tamanhoOrigem,
    0,
    0,
    TAMANHO_SAIDA,
    TAMANHO_SAIDA,
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

function EditorRecorteFoto({
  imagem,
  onCancelar,
  onEscolherOutra,
  onSalvar,
}: EditorRecorteFotoProps) {
  const [zoom, setZoom] = useState(1);
  const [posicao, setPosicao] = useState<Posicao>({ x: 0, y: 0 });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const arraste = useRef<{
    pointerId: number;
    inicioX: number;
    inicioY: number;
    origem: Posicao;
  } | null>(null);

  const escalaBase = TAMANHO_RECORTE / Math.min(imagem.largura, imagem.altura);
  const escala = escalaBase * zoom;
  const estiloImagem: CSSProperties = {
    width: imagem.largura * escala,
    height: imagem.altura * escala,
    transform: `translate(calc(-50% + ${posicao.x}px), calc(-50% + ${posicao.y}px))`,
  };

  function iniciarArraste(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    arraste.current = {
      pointerId: event.pointerId,
      inicioX: event.clientX,
      inicioY: event.clientY,
      origem: posicao,
    };
  }

  function moverImagem(event: ReactPointerEvent<HTMLDivElement>) {
    const atual = arraste.current;
    if (!atual || atual.pointerId !== event.pointerId) return;

    setPosicao(limitarPosicao({
      x: atual.origem.x + event.clientX - atual.inicioX,
      y: atual.origem.y + event.clientY - atual.inicioY,
    }, zoom, imagem));
  }

  function finalizarArraste(event: ReactPointerEvent<HTMLDivElement>) {
    if (arraste.current?.pointerId !== event.pointerId) return;
    arraste.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function salvarRecorte() {
    if (salvando) return;
    setSalvando(true);
    setErro('');

    try {
      const foto = await criarFotoRecortada(imagem, zoom, posicao);
      onSalvar(foto);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar a foto.');
      setSalvando(false);
    }
  }

  return (
    <div className="overlay-editor-foto" role="presentation">
      <section
        className="editor-foto-perfil"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-editor-foto"
      >
        <header className="topo-editor-foto">
          <button
            type="button"
            className="acao-editor-foto voltar-editor-foto"
            onClick={onEscolherOutra}
            aria-label="Voltar à seleção de arquivos"
            title="Escolher outra imagem"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9.2 6.2 4 11.4l5.2 5.2M4.4 11.4h8.1c4.4 0 7.1 2.2 7.1 6.4" />
            </svg>
          </button>
          <div>
            <h2 id="titulo-editor-foto">Recortar foto</h2>
            <p>Arraste a imagem e ajuste o zoom.</p>
          </div>
          <button
            type="button"
            className="acao-editor-foto fechar-editor-foto"
            onClick={onCancelar}
            aria-label="Cancelar adição da foto"
            title="Cancelar"
          >
            ×
          </button>
        </header>

        <div
          className="area-recorte-foto"
          onPointerDown={iniciarArraste}
          onPointerMove={moverImagem}
          onPointerUp={finalizarArraste}
          onPointerCancel={finalizarArraste}
        >
          <img src={imagem.src} alt="Imagem selecionada para recorte" draggable={false} style={estiloImagem} />
          <span className="grade-recorte-foto" aria-hidden="true" />
        </div>

        <label className="controle-zoom-foto">
          <span>Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => {
              const novoZoom = event.currentTarget.valueAsNumber;
              setZoom(novoZoom);
              setPosicao((atual) => limitarPosicao(atual, novoZoom, imagem));
            }}
          />
        </label>

        <p className="nota-editor-foto">A foto será salva somente neste dispositivo.</p>
        {erro ? <p className="erro-editor-foto" role="alert">{erro}</p> : null}

        <button
          type="button"
          className="salvar-editor-foto"
          onClick={salvarRecorte}
          disabled={salvando}
        >
          {salvando ? 'Salvando…' : 'Salvar foto'}
        </button>
      </section>
    </div>
  );
}

export function Perfil() {
  const { id, nome, email } = useAuth();
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [fotoUsuario, setFotoUsuario] = useState(() => ({
    usuarioId: id,
    foto: carregarFotoPerfil(id),
  }));
  const [imagemSelecionada, setImagemSelecionada] =
    useState<ImagemSelecionada | null>(null);
  const [erroArquivo, setErroArquivo] = useState('');
  const [lendoArquivo, setLendoArquivo] = useState(false);
  const foto = fotoUsuario.usuarioId === id
    ? fotoUsuario.foto
    : carregarFotoPerfil(id);

  async function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!arquivo) return;

    const extensaoPermitida = /\.(?:jpe?g|png)$/i.test(arquivo.name);
    if ((!TIPOS_PERMITIDOS.has(arquivo.type) && !extensaoPermitida) ||
      arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
      setErroArquivo(
        arquivo.size > TAMANHO_MAXIMO_ARQUIVO
          ? 'A imagem deve ter no máximo 15 MB.'
          : 'Escolha uma imagem JPG, JPEG ou PNG.',
      );
      return;
    }

    setLendoArquivo(true);
    setErroArquivo('');

    try {
      const src = await lerArquivoComoDataUrl(arquivo);
      const imagem = await carregarImagem(src);
      setImagemSelecionada({
        id: `${arquivo.name}-${arquivo.lastModified}-${Date.now()}`,
        src,
        largura: imagem.naturalWidth,
        altura: imagem.naturalHeight,
      });
    } catch (error) {
      setErroArquivo(
        error instanceof Error ? error.message : 'Não foi possível abrir esta imagem.',
      );
    } finally {
      setLendoArquivo(false);
    }
  }

  function cancelarEdicao() {
    setImagemSelecionada(null);
    setErroArquivo('');
  }

  function confirmarFoto(fotoRecortada: string) {
    if (!salvarFotoPerfil(id, fotoRecortada)) {
      throw new Error('Não foi possível guardar a foto neste dispositivo.');
    }

    setFotoUsuario({ usuarioId: id, foto: fotoRecortada });
    setImagemSelecionada(null);
  }

  return (
    <main className="pagina-perfil">
      <section className="card-perfil" aria-labelledby="titulo-perfil">
        <header className="cabecalho-perfil">
          <div className="avatar-perfil">
            {foto ? (
              <img className="foto-usuario-perfil" src={foto} alt={`Foto de perfil de ${nome}`} />
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12.25a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2.1c-4.24 0-7.75 2.18-7.75 4.82V21h15.5v-1.83c0-2.64-3.51-4.82-7.75-4.82Z" />
              </svg>
            )}
            <button
              type="button"
              className="indicador-foto-perfil"
              onClick={() => inputArquivo.current?.click()}
              aria-label={foto ? 'Trocar foto do perfil' : 'Adicionar foto ao perfil'}
              title={foto ? 'Trocar foto' : 'Adicionar foto'}
              disabled={lendoArquivo}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.2 6.5 9.4 4.8h5.2l1.2 1.7H19A2 2 0 0 1 21 8.5v8A2 2 0 0 1 19 18.5H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3.2ZM12 16a3.75 3.75 0 1 0 0-7.5A3.75 3.75 0 0 0 12 16Z" />
              </svg>
            </button>
            <input
              ref={inputArquivo}
              className="input-foto-perfil"
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              onChange={selecionarArquivo}
            />
          </div>

          <div className="apresentacao-perfil">
            <span>Minha conta</span>
            <h1 id="titulo-perfil">Seu perfil</h1>
            <p>Estas são as informações vinculadas à sua conta.</p>
            {erroArquivo ? <p className="erro-arquivo-perfil" role="alert">{erroArquivo}</p> : null}
          </div>
        </header>

        <div className="dados-perfil">
          <div className="campo-informacao-perfil">
            <span className="icone-informacao-perfil" aria-hidden="true">👤</span>
            <div>
              <span className="rotulo-informacao-perfil">Nome</span>
              <strong>{nome}</strong>
            </div>
          </div>

          <div className="campo-informacao-perfil">
            <span className="icone-informacao-perfil" aria-hidden="true">✉️</span>
            <div>
              <span className="rotulo-informacao-perfil">E-mail</span>
              <strong>{email}</strong>
            </div>
          </div>
        </div>

        <p className="aviso-sincronizacao-perfil">
          <span aria-hidden="true">☁️</span>
          Suas listas são vinculadas a esta conta e sincronizadas com a nuvem.
        </p>
      </section>

      {imagemSelecionada ? (
        <EditorRecorteFoto
          key={imagemSelecionada.id}
          imagem={imagemSelecionada}
          onCancelar={cancelarEdicao}
          onEscolherOutra={() => inputArquivo.current?.click()}
          onSalvar={confirmarFoto}
        />
      ) : null}
    </main>
  );
}
