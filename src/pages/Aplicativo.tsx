import { Link } from 'react-router-dom';
import tituloImg from '../assets/liste-&-compre.png';
import {
  APP_ANDROID_DOWNLOAD_URL,
  detectarPlataforma,
  type PlataformaAcesso,
} from '../config/appDownload';
import './Aplicativo.css';

const mensagens: Record<
  PlataformaAcesso,
  { titulo: string; texto: string; botao: string; compativel: boolean }
> = {
  android: {
    titulo: 'Seu Android é compatível',
    texto:
      'Você pode instalar o Liste & Compre diretamente no seu dispositivo. O download abaixo é a versão oficial atual do aplicativo.',
    botao: 'Baixar o Liste & Compre',
    compativel: true,
  },
  ios: {
    titulo: 'Ainda não disponível para iPhone e iPad',
    texto:
      'O aplicativo atual é exclusivo para Android. O arquivo APK não pode ser instalado no iOS, mas a versão web continua disponível normalmente neste dispositivo.',
    botao: 'Baixar APK Android (não compatível com iOS)',
    compativel: false,
  },
  desktop: {
    titulo: 'O aplicativo é feito para Android',
    texto:
      'O APK não é compatível com Windows, macOS ou Linux. Você pode manter o download para transferir o arquivo a um celular Android ou continuar usando a versão web no computador.',
    botao: 'Baixar APK Android (não compatível com desktop)',
    compativel: false,
  },
};

export function Aplicativo() {
  const plataforma = detectarPlataforma();
  const mensagem = mensagens[plataforma];

  return (
    <main className="pagina-aplicativo">
      <section className="card-aplicativo" aria-labelledby="titulo-aplicativo">
        <img src={tituloImg} alt="Liste e Compre" className="logo-aplicativo" />

        <span className="selo-aplicativo">Aplicativo oficial</span>
        <h1 id="titulo-aplicativo">Leve o Liste & Compre com você</h1>
        <p className="introducao-aplicativo">
          O Liste & Compre continua gratuito, sem propagandas e com a mesma proposta:
          facilitar suas listas, compras e histórico sem cobrar pelo acesso.
        </p>

        <div
          className={`status-aplicativo ${mensagem.compativel ? 'compativel' : 'incompativel'}`}
        >
          <div className="icone-status-aplicativo" aria-hidden="true">
            {mensagem.compativel ? '✓' : 'i'}
          </div>
          <div>
            <h2>{mensagem.titulo}</h2>
            <p>{mensagem.texto}</p>
          </div>
        </div>

        <a
          className="botao-download-aplicativo"
          href={APP_ANDROID_DOWNLOAD_URL}
          download
        >
          {mensagem.botao}
        </a>
        <p className="versao-aplicativo">Versão Android atual: v1.0</p>

        <div className="explicacao-aplicativo">
          <h2>Por que ainda não existe uma versão para iOS?</h2>
          <p>
            O aplicativo está sendo distribuído primeiro para Android. A publicação
            para iPhone e iPad exige um processo de distribuição diferente, então a
            versão para iOS ainda não está disponível. Enquanto isso, usuários de iOS
            e desktop podem continuar utilizando o Liste & Compre pela web.
          </p>
        </div>

        {plataforma !== 'android' && (
          <Link className="voltar-web-aplicativo" to="/">
            Continuar na versão web
          </Link>
        )}

        <Link className="link-privacidade-aplicativo" to="/privacidade">
          Política de Privacidade
        </Link>
      </section>
    </main>
  );
}
