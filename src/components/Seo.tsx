import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://listeecompre.marcuscamargo-portfolio.com.br';

const paginas: Record<
  string,
  { title: string; description: string; index: boolean }
> = {
  '/': {
    title: 'Liste & Compre | Organize suas listas e compras',
    description:
      'Crie listas de compras, acompanhe suas compras e consulte seu histórico com o Liste & Compre.',
    index: true,
  },
  '/aplicativo': {
    title: 'Aplicativo Liste & Compre para Android',
    description:
      'Conheça e baixe o aplicativo Liste & Compre para Android e organize suas listas e compras pelo celular.',
    index: true,
  },
  '/apoie': {
    title: 'Apoie o Liste & Compre',
    description:
      'Conheça formas de apoiar o desenvolvimento independente do Liste & Compre e outros projetos de Marcus Camargo.',
    index: true,
  },
  '/privacidade': {
    title: 'Política de Privacidade | Liste & Compre',
    description:
      'Consulte a Política de Privacidade do Liste & Compre e saiba como os dados são tratados no serviço.',
    index: true,
  },
};

function definirMeta(name: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function definirProperty(property: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function definirCanonical(url: string) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}

export function Seo() {
  const location = useLocation();

  useEffect(() => {
    const pagina = paginas[location.pathname] ?? {
      title: 'Liste & Compre',
      description:
        'Organize suas listas de compras e acompanhe suas compras com o Liste & Compre.',
      index: false,
    };

    const canonicalUrl = `${SITE_URL}${location.pathname === '/' ? '/' : location.pathname}`;

    document.title = pagina.title;
    definirMeta('description', pagina.description);
    definirMeta(
      'robots',
      pagina.index ? 'index, follow' : 'noindex, nofollow',
    );
    definirCanonical(canonicalUrl);

    definirProperty('og:type', 'website');
    definirProperty('og:locale', 'pt_BR');
    definirProperty('og:site_name', 'Liste & Compre');
    definirProperty('og:title', pagina.title);
    definirProperty('og:description', pagina.description);
    definirProperty('og:url', canonicalUrl);

    definirMeta('twitter:card', 'summary');
    definirMeta('twitter:title', pagina.title);
    definirMeta('twitter:description', pagina.description);
  }, [location.pathname]);

  return null;
}
