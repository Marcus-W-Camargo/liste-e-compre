# 🛒 Liste & Compre

> Planeje sua lista, acompanhe sua compra e transforme o histórico em informação útil para a próxima.

[![React](https://img.shields.io/badge/React-19.2-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Database%20%2B%20Storage-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Production-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![CI](https://github.com/Marcus-W-Camargo/liste-e-compre/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Marcus-W-Camargo/liste-e-compre/actions/workflows/ci.yml)

🌐 **Aplicação:** https://listeecompre.vercel.app/

---

## Sobre o projeto

**Liste & Compre** é uma aplicação web criada para acompanhar uma compra do planejamento à conclusão.

A proposta vai além de uma checklist convencional. O sistema conecta:

1. criação da lista;
2. organização de produtos;
3. definição de quantidade e medida;
4. acompanhamento da compra em tempo real;
5. registro de preços;
6. itens extras;
7. tratamento de pendências;
8. histórico;
9. reutilização de compras anteriores.

A aplicação utiliza **React + TypeScript + Vite** no frontend, **Supabase** para autenticação, dados e Storage e **Vercel Functions** para fluxos que exigem processamento de servidor.

---

## 🎯 Problema que o projeto resolve

Uma lista tradicional informa o que comprar, mas perde contexto assim que a compra começa.

O Liste & Compre foi construído para manter no mesmo fluxo:

- planejamento;
- execução;
- preços;
- quantidades;
- peso;
- progresso;
- gastos extras;
- histórico.

A lista deixa de ser um documento descartável e passa a ser a origem de uma sessão de compra que pode posteriormente alimentar novas listas.

---

## ✨ Principais funcionalidades

### 📝 Listas

O usuário pode:

- criar listas;
- adicionar produtos;
- organizar por categoria;
- definir quantidade;
- utilizar unidade ou quilograma;
- filtrar categorias;
- salvar;
- editar;
- renomear;
- excluir;
- definir data prevista para a compra.

### 🔎 Catálogo e autocomplete

O projeto possui uma biblioteca interna com mais de **900 produtos**.

As sugestões:

- aparecem após digitação mínima;
- toleram diferenças de acentos;
- ignoram diferenças entre maiúsculas e minúsculas;
- continuam permitindo itens personalizados.

O catálogo é mantido a partir de arquivos-fonte e pode ser regenerado por script.

### 🛒 Compra em andamento

Durante a compra é possível:

- marcar itens;
- registrar preço;
- alterar quantidade;
- alternar unidade e quilograma;
- acompanhar total por item;
- acompanhar total parcial;
- visualizar progresso;
- adicionar extras;
- usar autocomplete em extras;
- tratar itens pendentes antes da finalização.

### 💰 Valores em tempo real

Preços e quantidades são usados para recalcular os valores durante a compra, permitindo acompanhar o gasto antes do fechamento no caixa.

### ⚖️ Unidade e quilograma

Itens podem ser controlados por:

```text
un
Kg
```

Produtos por peso aceitam valores decimais e preservam a informação necessária para histórico e cálculo.

### ➕ Extras

Itens que não estavam na lista inicial podem ser adicionados durante a compra.

Eles continuam identificados no histórico, permitindo diferenciar compra planejada de gasto adicional.

### 🧾 Histórico

Compras finalizadas preservam informações como:

- lista;
- data;
- itens;
- quantidade;
- medida;
- preço;
- total;
- extras.

O histórico também permite:

- consultar produtos de compras anteriores;
- visualizar o total acumulado;
- recriar uma nova lista a partir de uma compra concluída.

Preços antigos não são transformados automaticamente em novos preços planejados.

---

## 👤 Conta e perfil

A aplicação possui experiência individual por usuário.

Recursos de conta incluem:

- cadastro;
- login;
- recuperação de acesso;
- verificação por código;
- página Minha Conta;
- nome e e-mail;
- foto de perfil;
- alteração e remoção da foto;
- logout;
- exclusão de conta.

### 📷 Foto de perfil

A imagem é:

- selecionada pelo usuário;
- recortada e redimensionada no navegador;
- otimizada antes do upload;
- armazenada no Supabase Storage;
- acessada de forma isolada por usuário.

A interface reutiliza URLs assinadas enquanto apropriado para evitar transferências desnecessárias da mesma imagem.

---

## 🆘 Central de Ajuda

A aplicação inclui uma área própria de suporte com:

- guia visual;
- FAQ;
- elogios;
- reclamações;
- relatos de bug.

O envio é processado por backend dedicado e pode utilizar informações básicas do navegador em relatos de bug para auxiliar no diagnóstico.

---

## 📱 Navegação e experiência

O projeto possui comportamentos específicos para desktop e mobile.

### Mobile

- navegação por swipe;
- campos numéricos adequados ao toque;
- layout reorganizado para telas estreitas;
- cabeçalho e rodapé adaptados;
- proteção de campos editáveis contra gestos conflitantes.

### Desktop

Atalhos de navegação:

```text
A / ←  → página anterior
D / →  → próxima página
```

As setas verticais permanecem disponíveis para scroll.

Atalhos horizontais são ignorados quando o usuário está editando um campo.

---

## 🧠 Decisões de arquitetura

### Dados persistentes x estado transitório

Nem todo dado precisa viver no servidor.

No Liste & Compre:

**Sincronizado por conta:**

- listas;
- rascunhos;
- compras concluídas;
- histórico;
- dados de perfil aplicáveis.

**Mantido no navegador atual:**

- compra ainda não finalizada.

Essa separação reduz sincronizações desnecessárias durante uma compra presencial e evita tratar um estado transitório como registro definitivo.

> O projeto não deve ser interpretado como offline-first nem como editor colaborativo em tempo real.

### Compra em andamento por usuário

A sessão local é isolada por conta no `localStorage`.

Ela pode sobreviver a:

- troca de página;
- visita ao histórico;
- fechamento da tela de compra;
- retomada posterior no mesmo navegador.

A sessão só é removida após uma finalização válida.

### Frontend + funções serverless

A SPA fica responsável pela experiência do usuário, enquanto fluxos que não devem depender apenas do navegador passam por **Vercel Functions**.

O repositório separa:

```text
api/
server/
```

permitindo manter entradas serverless pequenas e concentrar regras compartilhadas em handlers próprios.

---

## ☁️ Sincronização

A infraestrutura utiliza Supabase para manter os dados associados à conta.

O sistema diferencia:

- carregamento inicial;
- alterações locais;
- persistência remota;
- conflitos;
- dados que não devem ser enviados como parte do estado sincronizado.

A arquitetura também é compartilhada conceitualmente com o aplicativo mobile do Liste & Compre, mantendo interfaces e bases de código independentes.

---

## 🔐 Autenticação e segurança

O projeto utiliza uma combinação de frontend autenticado, Supabase e endpoints de servidor.

Práticas presentes na arquitetura:

- Supabase Auth;
- separação por usuário;
- Storage privado;
- URLs assinadas para arquivos;
- código de verificação para fluxos sensíveis;
- validação de payloads no servidor;
- limite de tamanho de requisição;
- validação de origem;
- rate limiting em endpoints apropriados;
- segredos apenas em ambiente de servidor;
- CI com `contents: read`;
- instalação determinística com `npm ci`.

O cliente não deve receber chaves administrativas do Supabase.

---

## ✉️ Serviços de e-mail

O projeto utiliza serviços diferentes de acordo com a responsabilidade:

- **EmailJS** — entrega de códigos nos fluxos de autenticação/verificação;
- **Resend** — envio das mensagens da Central de Ajuda.

Credenciais sensíveis devem permanecer configuradas apenas nos ambientes apropriados.

---

## 🧪 Qualidade e CI

O workflow principal executa, em Node.js 24:

```bash
npm ci
npm test
npm run build
npm run lint
```

O projeto combina:

- Node Test;
- Vitest;
- Testing Library;
- PGlite em cenários de teste;
- Oxlint;
- TypeScript;
- GitHub Actions.

Validações adicionais de configuração podem ser executadas localmente antes de iniciar a aplicação.

---

## 🏗️ Stack

| Camada | Tecnologia | Responsabilidade |
| --- | --- | --- |
| Interface | React 19.2 | Componentes |
| Linguagem | TypeScript 6 | Tipagem |
| Navegação | React Router 7 | Rotas |
| Build | Vite 8.2 | Desenvolvimento e bundle |
| Auth | Supabase Auth | Contas e sessões |
| Banco | PostgreSQL / Supabase | Dados da aplicação |
| Storage | Supabase Storage | Fotos de perfil |
| Estado local | localStorage | Compra em andamento |
| Serverless | Vercel Functions | APIs auxiliares |
| E-mail de verificação | EmailJS | Códigos |
| Feedback | Resend | Mensagens de suporte |
| Testes | Node Test + Vitest | Validação automatizada |
| Lint | Oxlint | Análise estática |
| CI | GitHub Actions | Teste, build e lint |
| Deploy | Vercel | SPA e funções |

---

## 📁 Estrutura principal

```text
.
├── api/                         # Entradas das Vercel Functions
├── server/                      # Handlers e regras de servidor
├── shared/                      # Contratos compartilhados
├── data/                        # Catálogo-fonte
├── docs/
│   ├── ARQUITETURA.md           # Arquitetura detalhada
│   └── CONFIGURACAO.md          # Configuração completa
├── scripts/
│   ├── gerar-catalogo-produtos.mjs
│   ├── check-config.mjs
│   └── dev-api.mjs
├── src/
│   ├── components/
│   ├── data/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   └── utils/
├── tests/
├── .github/workflows/ci.yml
├── package.json
└── README.md
```

---

## 📚 Documentação complementar

O README principal funciona como visão de produto e arquitetura.

Para detalhes de implementação e ambiente:

- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — decisões, responsabilidades e fluxos técnicos;
- [`docs/CONFIGURACAO.md`](docs/CONFIGURACAO.md) — ambiente local, Supabase, e-mail e configuração dos serviços.

Essa separação evita transformar o README em um manual de dezenas de páginas e mantém a documentação aprofundada disponível para quem precisa dela.

---

## ⚙️ Execução local

### Requisitos

- Node.js `24.x`;
- npm;
- projeto Supabase;
- credenciais dos serviços utilizados pela aplicação.

### Instalação

```bash
git clone https://github.com/Marcus-W-Camargo/liste-e-compre.git
cd liste-e-compre
npm ci
```

### Configuração

Crie o arquivo de ambiente conforme a documentação e valide:

```bash
npm run check:config
```

### Frontend

```bash
npm run dev
```

### API local

```bash
npm run dev:api
```

Para utilizar frontend e APIs em desenvolvimento, execute os dois processos.

---

## ✅ Validação local

```bash
npm run catalog:generate
npm test
npm run build
npm run lint
```

---

## 🚀 Produção

**Aplicação:**  
https://listeecompre.vercel.app/

Configuração principal:

```text
Framework: Vite
Runtime Node.js: 24.x
Build: npm run build
Output: dist
Serverless: Vercel Functions
```

---

## 📱 Liste & Compre APP

O ecossistema também possui um aplicativo mobile separado, construído com React Native + Expo.

📦 **Repositório:**  
https://github.com/Marcus-W-Camargo/Liste-Compre-APP

Web e APP compartilham infraestrutura e dados da conta quando apropriado, mas permanecem aplicações independentes, criadas para experiências diferentes.

---

## 📄 Licença

O projeto utiliza a **Licença MIT**.

Consulte:

- [`LICENSE`](LICENSE);
- [`LICENSE.pt-br.md`](LICENSE.pt-br.md).

---

## 👨‍💻 Autor

Desenvolvido por **Marcus Camargo**.

**GitHub:**  
https://github.com/Marcus-W-Camargo

**Portfólio:**  
https://marcuscamargo-portfolio.mcpt.workers.dev/

---

## Liste & Compre

**Planeje. Compre. Acompanhe.**

Um fluxo criado para continuar útil antes, durante e depois de cada compra.
