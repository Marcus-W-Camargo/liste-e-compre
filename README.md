# 🛒 Liste e Compre

> Planeje sua lista, acompanhe sua compra e consulte seu histórico.<br>
> Plan your list, track your shopping and review your purchase history.

[![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Database-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![EmailJS](https://img.shields.io/badge/EmailJS-Email%20Delivery-F7501B)](https://www.emailjs.com/)
[![CI](https://github.com/Marcus-W-Camargo/liste-e-compre/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Marcus-W-Camargo/liste-e-compre/actions/workflows/ci.yml)

🌐 **Acessar / Open:** [liste-e-compre.vercel.app](https://liste-e-compre.vercel.app/)

**Idioma / Language:** [🇧🇷 Português](#portugues) · [🇺🇸 English](#english)

---

<a id="portugues"></a>

## 🇧🇷 Português (Brasil)

### Sobre o projeto

**Liste e Compre** é uma aplicação para organizar compras do planejamento à conclusão. O usuário cria listas por categoria, informa quantidades, agenda uma data prevista e acompanha os produtos e valores durante a compra. Ao finalizar, o registro passa a integrar seu histórico.

Desenvolvido para estudo e portfólio, o projeto evoluiu de uma implementação baseada em `localStorage` para contas autenticadas e persistência no Supabase. Listas, rascunhos, compra em andamento e histórico ficam vinculados ao usuário, permitindo retomá-los em outros dispositivos após a sincronização.

A aplicação é uma SPA em **React + TypeScript**, construída com **Vite**, com **Supabase Auth e PostgreSQL**, uma API de autenticação na **Vercel** e entrega dos códigos de verificação pelos templates do **EmailJS**.

> A interface atual está em português brasileiro, com valores em reais (BRL). Este README é bilíngue; a versão em inglês do site faz parte do roadmap.

---

### Como o Liste e Compre funciona

1. O usuário informa nome, e-mail e senha no formulário de cadastro.
2. Antes de enviar o código, a API consulta se o e-mail já pertence a uma conta.
3. Se o endereço estiver disponível, o servidor gera um código de quatro dígitos e solicita sua entrega pelo EmailJS.
4. Após a confirmação correta, o Supabase Auth cria a conta; o usuário pode fazer login.
5. Na criação da lista, são adicionados produtos, categorias, quantidades e unidades de medida.
6. A lista recebe um nome e pode ser editada, renomeada, excluída ou agendada para uma data prevista.
7. Durante a compra, o usuário informa preços, ajusta quantidades, marca produtos e adiciona itens extras.
8. Itens pendentes podem ser concluídos, removidos ou transferidos para outra lista salva.
9. A compra finalizada é registrada no histórico com seus itens, data, total e gastos com extras.
10. Os dados sincronizados ficam disponíveis ao entrar na mesma conta em outro dispositivo.

---

### Tecnologias

| Camada | Tecnologia | Função |
| --- | --- | --- |
| Interface | React 19 | Componentes, formulários e estado das telas |
| Linguagem | TypeScript 6 | Tipagem do frontend e dos modelos de dados |
| Navegação | React Router 7 | Rotas públicas, privadas e sessão de compra |
| Build | Vite 8 | Desenvolvimento, proxy local e build de produção |
| Estilização | CSS | Identidade visual, componentes, animações e ajustes responsivos |
| Autenticação | Supabase Auth | Contas, hashing de senhas, login e sessões |
| Banco | PostgreSQL / Supabase | Listas, compras, perfis, RLS e funções SQL |
| API | Vercel Functions + Node.js | Geração e confirmação dos códigos, cadastro e recuperação |
| E-mail | EmailJS | Entrega dos templates de cadastro e recuperação |
| Limpeza agendada | Supabase Cron / `pg_cron` | Remoção do controle de envios fora da janela de limite |
| Testes | Node Test Runner, PGlite, Vitest, Testing Library e jsdom | API, SQL, isolamento, sincronização e formulários |
| Qualidade | Oxlint + GitHub Actions | Lint, testes e build automatizados |
| Hospedagem | Vercel | Publicação da SPA e da API |

---

### Funcionalidades atuais

#### Conta, cadastro e acesso

- Cadastro com **Nome e Sobrenome em um único campo**: duas partes compostas por letras, um único espaço e até 21 caracteres. Nomes podem se repetir.
- Normalização do e-mail para comparação sem espaços nas extremidades e sem distinção entre maiúsculas e minúsculas.
- Consulta de conta existente **antes de gerar código, reservar envio ou chamar o EmailJS**. A recusa aparece no próprio formulário, sem avançar para a verificação.
- Interrupção do envio quando a consulta inicial falha; uma falha não é interpretada como endereço disponível.
- Senha entre 6 e 128 caracteres, com letra, número e um dos caracteres especiais aceitos: `! @ # $ % & * / ? _ -`.
- Confirmação da senha, feedback visual dos requisitos e opção de mostrar/ocultar o conteúdo.
- Máscara visual com frutas nos campos de senha, preservando o uso de `type="password"` quando ocultos.
- Confirmação do cadastro em quatro campos numéricos, com avanço de foco, colagem do código e navegação com Backspace.
- Login por e-mail e senha, com sessão validada pelo Supabase.
- Recuperação por e-mail em três etapas: solicitar código, confirmar e definir uma nova senha.
- Menu da conta com saudação, acesso ao perfil e logout com confirmação.
- Logout aguarda a sincronização antes de encerrar a sessão.
- Página **Minha conta** com nome e e-mail; não há edição de perfil nesta versão.
- Proteção das páginas de listas, compras, histórico e perfil para usuários autenticados.

#### Criação e edição de listas

- Inclusão de produtos com nome, categoria e quantidade.
- Medidas por **unidade (`un`)** ou **quilograma (`Kg`)**, com três casas decimais para pesos.
- Botões de incremento/decremento para unidades e edição direta de quantidades.
- Alteração da unidade de medida e remoção de produtos.
- Filtro por categoria ou visualização geral, com contador dos itens exibidos.
- Rascunho sincronizado, separado das listas já salvas.
- Salvamento com nome próprio, impedindo listas vazias, nomes vazios e nomes repetidos na mesma conta.
- Painel **Minhas Listas** com nome, quantidade de itens e data de modificação.
- Reabertura de listas para edição, atualização dos itens, renomeação e exclusão.
- Aviso ao trocar de lista com itens no editor, oferecendo salvar, continuar sem salvar ou cancelar.

Categorias disponíveis:

| Categoria | Identificação |
| --- | --- |
| Mercearia | 🍞 |
| Hortifrúti | 🍎 |
| Açougue | 🥩 |
| Laticínios | 🥛 |
| Limpeza | 🧹 |
| Higiene | 🧼 |

#### Catálogo e agendamento

- Página **Suas Listas**, com cards das listas disponíveis para compra.
- Cards com nome, número de itens e data de modificação ou data agendada.
- Ações para iniciar a compra ou definir uma data prevista.
- Navegação entre criação de listas e catálogo de compras.

O agendamento registra a data e a exibe na interface; **não envia lembretes nem notificações**.

#### Compra em andamento

- Abertura da lista em uma sessão de compra, com retomada do estado sincronizado ao voltar à mesma lista.
- Seções expansíveis de visão geral e categorias.
- Marcação e desmarcação de produtos, edição de preço e quantidade e troca de unidade de medida.
- Atualização automática da marcação ao alterar preço ou quantidade: o item fica marcado quando ambos são positivos.
- Cálculo do valor de cada linha e do total parcial dos itens marcados com preço e quantidade positivos.
- Indicador circular de progresso, calculado pela proporção de itens marcados, e não pelo valor gasto.
- Adição de produtos não planejados, identificados como **Extra**.
- Remoção de itens durante a compra.
- Bloqueio da finalização enquanto houver pendências, com opções de concluir, apagar ou transferir os itens para outra lista salva.
- Transferência de pendentes com novos identificadores na lista de destino, sem levar o estado de compra.
- Finalização com gravação do histórico, remoção da lista do catálogo ativo e encerramento da sessão.

**Limite atual:** há uma compra em andamento por conta. Iniciar outra lista substitui a sessão ativa anterior; não há várias compras simultâneas.

#### Totais e itens extras

Os cálculos atuais usam:

- **Total do item:** preço informado × quantidade.
- **Total parcial:** soma dos itens marcados com preço e quantidade positivos.
- **Progresso:** quantidade de itens marcados ÷ quantidade de itens na sessão, arredondada em percentual.
- **Gastos adicionais:** soma dos produtos identificados como extras na compra finalizada.

O gasto básico com extras **já existe** e aparece no histórico. O roadmap prevê ampliar a análise, a comparação com o planejamento e a apresentação desses valores. O cálculo atual não classifica automaticamente o aumento da quantidade de um produto planejado como gasto extra.

#### Histórico de compras

- Registro das compras finalizadas, exibido das mais recentes para as mais antigas.
- Nome da lista, data e horário de conclusão, quantidade de itens, total de extras e valor total por compra.
- Total acumulado das compras finalizadas.
- Preservação dos itens, quantidades, preços e origem planejada/extra no banco.
- Retorno ao catálogo de listas.

A página atual apresenta um **resumo**. O detalhamento visual, a reformulação da tela e os gráficos de gastos ainda são melhorias futuras.

#### Interface e navegação

- Home com acesso ao fluxo **criar lista → comprar → consultar histórico**.
- Aviso de acesso para visitantes e atalhos para entrar ou cadastrar.
- Identidade visual com ilustrações de alimentos, cards, ícones, transições e tipografia Poppins.
- Modais de confirmação, mensagens de erro, estados vazios e indicação de processamento.
- Ajustes de CSS para telas menores; o refinamento mobile-first continua no roadmap.
- Indicadores globais de carregamento, salvamento, sincronização, erro e conflito.

**Áreas ainda em construção:** Ajuda exibe um placeholder; Sobre aparece no menu, mas ainda não abre uma página funcional.

---

### Rotas

| Rota | Acesso | Função |
| --- | --- | --- |
| `/` | Público | Página inicial |
| `/conta?modo=login` | Público | Login e acesso à recuperação |
| `/conta?modo=cadastro` | Público | Cadastro e confirmação de e-mail |
| `/lista` | Autenticado | Rascunho, criação e edição das listas |
| `/compre` | Autenticado | Catálogo e agendamento |
| `/compre/:listaId` | Autenticado | Compra em andamento |
| `/historico` | Autenticado | Resumo das compras finalizadas |
| `/perfil` | Autenticado | Nome e e-mail da conta |
| `/ajuda` | Autenticado | Página reservada, ainda em construção |

`/api/auth` é o endpoint de servidor para cadastro e recuperação, não uma página. Ele aceita requisições POST em JSON, verificando a origem e o tamanho do corpo.

---

### Arquitetura e banco de dados

O frontend cuida da interação. A API da Vercel cuida da verificação por e-mail. O Supabase Auth gerencia identidade e sessões; o PostgreSQL persiste os dados de cada conta.

| Componente | Responsabilidade |
| --- | --- |
| React + `CloudStore` | Estado em memória, fila de salvamento e recuperação de conflitos |
| `/api/auth` | Consulta de e-mail, geração/verificação do código e operações administrativas |
| EmailJS | Entrega dos códigos; não decide se a conta foi confirmada |
| Supabase Auth | E-mail de acesso, hash da senha, identidade e sessão |
| SQL + RLS | Isolamento por usuário, validação, transações e controle de revisão |
| Supabase Cron | Limpeza periódica do histórico usado no limite de envios |

Principais estruturas:

| Estrutura | Conteúdo |
| --- | --- |
| `auth.users` | Identidade administrada pelo Supabase Auth |
| `public.profiles` | Nome de apresentação vinculado à conta |
| `public.lists` | Rascunho e listas salvas, incluindo data prevista |
| `public.list_items` | Produtos, categorias, medidas e quantidades das listas |
| `public.purchases` | Compra em andamento e compras finalizadas |
| `public.purchase_items` | Itens da compra, preços, marcação e origem |
| `public.data_versions` | Revisão dos dados e identificação da última operação |
| `lc_private.verification_attempts` | Estado privado da tentativa e verificadores HMAC |
| `lc_private.email_sends` | Controle privado do limite de envios |
| `lc_private.last_codes` | Identificador HMAC do último código por e-mail |

As funções `lc_load_data` e `lc_save_data` usam a identidade autenticada. O navegador não recebe permissão para escrever diretamente nas tabelas. A consulta `lc_auth_email_exists` retorna somente um booleano e é restrita ao servidor.

A pasta [supabase](supabase) contém o SQL versionado; [ARQUITETURA.md](docs/ARQUITETURA.md) detalha as decisões e limitações.

---

### Sincronização e dados antigos

- As alterações entram em uma fila serial e são gravadas por conta.
- Cada salvamento utiliza uma revisão esperada e um identificador de operação, evitando sobrescrita silenciosa e duplicação em novas tentativas.
- Se outro dispositivo salvou uma versão mais recente, a aplicação informa o conflito e permite **baixar uma cópia JSON da edição** ou recarregar os dados da nuvem.
- Falhas de conexão oferecem nova tentativa; a edição pendente fica na memória da aba.
- O site consulta atualizações ao abrir as telas protegidas e ao recuperar o foco quando não há edição pendente.
- O navegador recebe um aviso de saída quando há alterações não sincronizadas, quando suportado.

Listas compatíveis da versão antiga podem ser importadas do `localStorage` do navegador atual, **somente para o mesmo e-mail e quando a conta ainda não possui dados na nuvem**. As cópias locais são preservadas. Usuários, senhas, códigos e flags antigas de autenticação não são importados.

> Não é uma aplicação offline-first nem um editor colaborativo em tempo real. Sem rede, alterações não sincronizadas podem ser perdidas ao fechar a aba. Aguarde “Dados sincronizados” ou baixe a cópia oferecida em caso de falha.

---

### Verificação de e-mail e segurança

- O servidor gera o código com `crypto.randomInt` e o vincula ao e-mail, propósito e tentativa.
- O código esperado não é devolvido ao navegador; o banco privado guarda verificadores HMAC.
- A senha não é enviada ao iniciar a verificação. A conta e o perfil são criados somente após a confirmação.
- A criação pública de usuários no Supabase deve ficar desativada; a API administrativa é usada apenas no servidor.
- A verificação antecipada evita envio para conta existente, e a proteção final de duplicidade permanece para cadastros concorrentes.
- A recuperação troca a confirmação por uma autorização separada e de uso único para redefinir a senha.
- Chaves privadas não usam prefixo `VITE_`, não ficam no frontend e não devem entrar no Git.
- Políticas RLS isolam os dados; uma flag alterada no `localStorage` não concede acesso.
- A API valida origem, formato e tamanho da requisição e omite dados sensíveis dos logs.

#### Política atual dos códigos

| Regra | Comportamento |
| --- | --- |
| Formato | Quatro dígitos, incluindo zeros à esquerda |
| Uso | Único, vinculado à tentativa |
| Validade temporal | Sem expiração por tempo |
| Erros | Cinco códigos incorretos encerram a tentativa |
| Envios | Até três solicitações por e-mail em 45 minutos, somando cadastro e recuperação |
| Repetição | O código imediatamente anterior do mesmo e-mail não se repete |
| Reenvio | Sem botão de reenvio ou contador de expiração |
| Saída da tela | Solicita cancelamento; abrir o app de e-mail não cancela |
| Limpeza | Controle de envios antigos removido a cada cinco minutos; não expira códigos |

Fechamentos abruptos podem impedir o cancelamento e deixar tentativas órfãs. Falhas de envio após a reserva contam para o limite, pois um timeout não comprova que o e-mail deixou de ser entregue.

A mensagem “conta existente” revela a presença do endereço no sistema. Não há limite próprio para essas consultas recusadas nem proteção global contra gasto distribuído. Quatro dígitos sem expiração são uma escolha simplificada deste projeto, **não uma recomendação para aplicações sensíveis**.

---

### Configuração e execução local

Requisitos: **Node.js 24 recomendado**, npm, projeto Supabase, serviço e templates EmailJS. O guia completo está em [CONFIGURACAO.md](docs/CONFIGURACAO.md).

```bash
git clone https://github.com/Marcus-W-Camargo/liste-e-compre.git
cd liste-e-compre
npm ci
```

#### 1. Preparar o Supabase

Em uma instalação inicial, execute no SQL Editor, como `postgres`, nesta ordem:

| Ordem | Script | Função |
| --- | --- | --- |
| 1 | [01-auth.sql](supabase/01-auth.sql) | Perfis, tentativas e confirmação |
| 2 | [02-lists.sql](supabase/02-lists.sql) | Listas, compras, isolamento e sincronização |
| 3 | [03-cleanup.sql](supabase/03-cleanup.sql) | Limpeza periódica via `pg_cron` |
| 4 | [04-email-precheck.sql](supabase/04-email-precheck.sql) | Consulta antes do envio de cadastro |

Desative **Allow new users to sign up** no Supabase Auth e mantenha o provedor Email habilitado. O código de quatro dígitos é próprio da aplicação; não usa o OTP nem os templates do Supabase.

Se a integração já está instalada e falta apenas a consulta antecipada, execute **somente o script 04**. Não recrie o projeto nem apague dados.

#### 2. Configurar o ambiente

Copie [.env.example](.env.example) para `.env.local`, sem sobrescrever uma configuração existente, e preencha:

| Variável | Uso | Visibilidade |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Pública |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave `sb_publishable_...` | Pública |
| `SUPABASE_URL` | Mesma URL usada no frontend | Servidor |
| `SUPABASE_SECRET_KEY` | Chave `sb_secret_...` | Secreta |
| `AUTH_VERIFICATION_SECRET` | Segredo aleatório dos verificadores HMAC | Secreta |
| `APP_ORIGIN` | Origem permitida da aplicação | Servidor |
| `EMAILJS_PUBLIC_KEY` | Identificação da conta EmailJS | Servidor |
| `EMAILJS_PRIVATE_KEY` | Autenticação privada do EmailJS | Secreta |
| `EMAILJS_SERVICE_ID` | Serviço de envio | Servidor |
| `EMAILJS_TEMPLATE_CADASTRO_ID` | Template de cadastro | Servidor |
| `EMAILJS_TEMPLATE_RECUPERACAO_ID` | Template de recuperação | Servidor |

Gere o segredo localmente:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Use `APP_ORIGIN=http://127.0.0.1:5173` no ambiente local. Nunca publique os valores secretos.

No EmailJS, permita chamadas de aplicações não-browser e exija a chave privada. Os templates recebem `to_email`, `nome` e `codigo`; a recuperação também recebe `recuperar`.

#### 3. Validar e iniciar

```bash
npm run check:config
```

A checagem verifica configuração, Supabase Auth e RPCs sem enviar e-mail nem criar conta. Ela não comprova a entrega nem a validade dos templates EmailJS.

Em um terminal:

```bash
npm run dev:api
```

Em outro:

```bash
npm run dev
```

Abra [http://127.0.0.1:5173](http://127.0.0.1:5173). O Vite encaminha `/api` para a API local na porta `3001`. `npm run preview` sozinho não inicia essa API. Reinicie os processos após mudar variáveis.

---

### Testes e qualidade

```bash
npm test
npm run build
npm run lint
```

A suíte cobre:

- cadastro, consulta antecipada, confirmação, cancelamento e recuperação;
- rejeição de código, token ou e-mail adulterados;
- tratamento de falhas sem envio indevido;
- SQL reexecutável, permissões e isolamento entre contas;
- sincronização, conflitos, importação e operações idempotentes;
- interação com os formulários React.

Os testes usam **PGlite e rede simulada**: não enviam e-mails, não criam contas externas e não exigem segredos. O workflow [ci.yml](.github/workflows/ci.yml) executa testes, build e lint nos pull requests e na `main`.

A entrega real de e-mail, o Supabase hospedado, o Cron e a experiência nos dispositivos precisam de validação no ambiente configurado.

---

### Deploy na Vercel

- Framework: **Vite**.
- Instalação: `npm ci`.
- Build: `npm run build`.
- Diretório de saída: `dist`.
- Node.js: **24.x**.
- API: `api/auth.js`.
- Produção: [liste-e-compre.vercel.app](https://liste-e-compre.vercel.app/).

Cadastre as variáveis nos ambientes corretos de **Preview** e **Production**. Em produção, use `APP_ORIGIN=https://liste-e-compre.vercel.app`.

As variáveis `VITE_*` entram no build: mudanças exigem novo deployment. O Preview permite a URL exata do deployment; outros aliases precisam corresponder a `APP_ORIGIN`. Preview e Production com o mesmo Supabase compartilham contas, dados e limites de envio.

O [vercel.json](vercel.json) mantém `/api/*` fora do fallback da SPA, permitindo abrir diretamente as rotas do site sem transformar a API em HTML.

---

### Estrutura do projeto

| Caminho | Conteúdo |
| --- | --- |
| [src/App.tsx](src/App.tsx) | Rotas, layout e perfil |
| [src/pages](src/pages) | Home, conta, listas, compras e histórico |
| [src/components](src/components) | Formulários, cards, modais, menu e estado de sincronização |
| [src/hooks](src/hooks) | Autenticação e manipulação das listas |
| [src/services](src/services) | Comunicação com a API e persistência na nuvem |
| [src/utils](src/utils) | Sessão e adaptação das operações de listas |
| [src/config/supabase.ts](src/config/supabase.ts) | Cliente público do Supabase |
| [src/types](src/types) | Modelos e categorias |
| [src/assets](src/assets) | Identidade visual |
| [api/auth.js](api/auth.js) | Entrada da função Vercel |
| [server](server) | Validação HTTP, fluxo de autenticação e provedores |
| [shared](shared) | Validações e fila de sincronização compartilhadas |
| [supabase](supabase) | Scripts SQL de instalação e atualização |
| [scripts](scripts) | API local e diagnóstico de configuração |
| [tests](tests) | Testes automatizados |
| [docs](docs) | Instalação, arquitetura e limitações |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | Integração contínua |

---

### Autor

Desenvolvido por [Marcus Camargo](https://github.com/Marcus-W-Camargo) para estudo, prática de desenvolvimento web e portfólio.

---

### Roadmap — próximas evoluções

As propostas abaixo representam trabalho futuro, sem prazo de entrega definido.

- [ ] **Reformular a página de Histórico:** melhorar a organização visual, navegação e apresentação dos detalhes de cada compra.
- [ ] **Criar cards com gráficos de gastos gerais e por categoria:** transformar os registros em uma visão visual de consumo e distribuição dos gastos.
- [ ] **Evoluir o cálculo de gastos com itens extras:** ampliar o cálculo básico existente, separar melhor planejado e adicional e evidenciar seu impacto no total.
- [ ] **Aprimorar a responsividade:** polir o CSS e priorizar celulares, com melhor uso do espaço, legibilidade e controles de toque.
- [ ] **Disponibilizar uma versão em inglês:** traduzir a interface e preparar textos, datas e formatação para internacionalização.
- [ ] **Levar o projeto para um app de celular:** avaliar a estratégia de portabilidade, preservando contas e sincronização com o Supabase.

---

<a id="english"></a>

## 🇺🇸 English

### About the project

**Liste e Compre** is a shopping organizer that covers planning, shopping and purchase history. Users create categorized lists, specify quantities, schedule a planned date and track products and prices while shopping. Completed purchases become part of their history.

Built for learning and portfolio development, the project evolved from a `localStorage` implementation to authenticated accounts and Supabase persistence. Lists, drafts, the active shopping session and purchase history belong to the user and can be accessed on other devices after synchronization.

The application is a **React + TypeScript** SPA built with **Vite**, backed by **Supabase Auth and PostgreSQL**, an authentication API on **Vercel**, and verification emails delivered through **EmailJS** templates.

> The current interface is in Brazilian Portuguese and uses Brazilian reais (BRL). This README is bilingual; an English version of the application is on the roadmap.

---

### How Liste e Compre works

1. The user enters their name, email and password in the registration form.
2. Before sending a code, the API checks whether the email already belongs to an account.
3. If the address is available, the server generates a four-digit code and requests delivery through EmailJS.
4. After successful verification, Supabase Auth creates the account and the user can sign in.
5. Products, categories, quantities and units are added to a shopping list.
6. The list is named and can be edited, renamed, deleted or assigned a planned shopping date.
7. During shopping, the user enters prices, adjusts quantities, checks off products and adds extra items.
8. Pending items can be completed, removed or transferred to another saved list.
9. The completed purchase is saved with its items, date, total and extra-item spending.
10. Synchronized data becomes available when signing into the same account on another device.

---

### Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| UI | React 19 | Components, forms and screen state |
| Language | TypeScript 6 | Typed frontend and data models |
| Routing | React Router 7 | Public/private routes and shopping sessions |
| Build | Vite 8 | Development, local proxy and production builds |
| Styling | CSS | Visual identity, components, animations and responsive adjustments |
| Authentication | Supabase Auth | Accounts, password hashing, sign-in and sessions |
| Database | PostgreSQL / Supabase | Lists, purchases, profiles, RLS and SQL functions |
| API | Vercel Functions + Node.js | Code generation/verification, registration and recovery |
| Email | EmailJS | Registration and recovery email delivery |
| Scheduled cleanup | Supabase Cron / `pg_cron` | Removal of send-limit records outside the rate-limit window |
| Testing | Node Test Runner, PGlite, Vitest, Testing Library and jsdom | API, SQL, isolation, synchronization and forms |
| Quality | Oxlint + GitHub Actions | Automated linting, tests and builds |
| Hosting | Vercel | SPA and API deployment |

---

### Current features

#### Accounts, registration and access

- Registration with **first name and surname in one field**: two letter-only parts, exactly one space and up to 21 characters. Display names do not need to be unique.
- Email normalization trims surrounding spaces and makes comparisons case-insensitive.
- Existing-account lookup **before code generation, send reservation or any EmailJS call**. Rejected registrations remain on the form without opening the verification screen.
- Failed initial lookups stop the email flow; an error is never interpreted as an available address.
- Passwords from 6 to 128 characters, containing a letter, a digit and an accepted special character: `! @ # $ % & * / ? _ -`.
- Password confirmation, visual requirement feedback and show/hide controls.
- Fruit-themed password masking, with `type="password"` retained while hidden.
- Four numeric registration-code fields with automatic focus advancement, paste support and Backspace navigation.
- Email/password sign-in with a Supabase-validated session.
- Three-step password recovery: request a code, verify it and choose a new password.
- Account menu with a greeting, profile access and logout confirmation.
- Logout waits for synchronization before ending the session.
- **My account** page displaying name and email; profile editing is not available in this version.
- Authentication required for lists, shopping, history and profile pages.

#### List creation and editing

- Products with a name, category and quantity.
- **Units (`un`)** or **kilograms (`Kg`)**, with three decimal places for weights.
- Unit increment/decrement buttons and direct quantity editing.
- Unit changes and product removal.
- Category filtering or an all-items view, with a count of displayed items.
- A synchronized draft separate from saved lists.
- Named lists, rejecting empty lists, empty names and duplicate list names within the same account.
- **My Lists** panel with names, item counts and modification dates.
- Reopening saved lists to edit their items, plus renaming and deletion.
- A warning before switching lists when the editor contains items, offering save, continue without saving or cancel.

Available categories:

| Category | Portuguese UI label |
| --- | --- |
| Groceries | 🍞 Mercearia |
| Produce | 🍎 Hortifrúti |
| Meat | 🥩 Açougue |
| Dairy | 🥛 Laticínios |
| Cleaning | 🧹 Limpeza |
| Personal hygiene | 🧼 Higiene |

#### Catalog and scheduling

- **Your Lists** page with cards for available shopping lists.
- Cards showing name, item count and modification or scheduled date.
- Actions to start shopping or set a planned date.
- Navigation between list creation and the shopping catalog.

Scheduling stores and displays a date; **it does not send reminders or notifications**.

#### Active shopping session

- Opening a list starts a shopping session; returning to the same list resumes its synchronized state.
- Expandable all-items and category sections.
- Check/uncheck controls, price and quantity editing, and unit changes.
- Editing a price or quantity automatically checks the item when both values are positive.
- Per-item totals and a running total for checked items with positive prices and quantities.
- A circular progress indicator based on the proportion of checked items, not on spending.
- Unplanned products can be added and labeled **Extra**.
- Products can be removed during shopping.
- Checkout is blocked while pending items remain, with options to complete, delete or transfer them to another saved list.
- Transferred items receive new identifiers in the destination list without carrying over their shopping state.
- Completion saves the purchase history, removes the list from the active catalog and closes the session.

**Current limit:** one active shopping session per account. Starting a different list replaces the previous active session; parallel shopping sessions are not supported.

#### Totals and extra items

Current calculations use:

- **Item total:** entered price × quantity.
- **Running total:** sum of checked items with positive prices and quantities.
- **Progress:** checked item count ÷ session item count, rounded to a percentage.
- **Additional spending:** sum of products marked as extras in the completed purchase.

Basic extra-item spending **is already calculated** and displayed in the history. Planned improvements cover deeper analysis, comparison with the original plan and presentation. Increasing the quantity of a planned product is not automatically classified as extra spending.

#### Purchase history

- Completed purchases displayed from newest to oldest.
- List name, completion date/time, item count, extra spending and total per purchase.
- Accumulated spending across completed purchases.
- Items, quantities, prices and planned/extra origin preserved in the database.
- Navigation back to the list catalog.

The current page is a **summary view**. Detailed visual exploration, the page redesign and spending charts remain future improvements.

#### Interface and navigation

- Home with the **create a list → shop → review history** flow.
- Access notices for visitors and sign-in/registration shortcuts.
- Food illustrations, cards, icons, transitions and Poppins typography.
- Confirmation dialogs, error messages, empty states and processing feedback.
- CSS adjustments for smaller screens; further mobile-first refinement is on the roadmap.
- Global loading, saving, synchronized, error and conflict indicators.

**Unfinished areas:** Help currently displays a placeholder; About is visible in the menu but does not open a functional page yet.

---

### Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Home |
| `/conta?modo=login` | Public | Sign-in and access to recovery |
| `/conta?modo=cadastro` | Public | Registration and email confirmation |
| `/lista` | Authenticated | Draft, list creation and editing |
| `/compre` | Authenticated | Catalog and scheduling |
| `/compre/:listaId` | Authenticated | Active shopping session |
| `/historico` | Authenticated | Completed purchase summary |
| `/perfil` | Authenticated | Account name and email |
| `/ajuda` | Authenticated | Reserved page, under construction |

`/api/auth` is the registration/recovery server endpoint, not a page. It accepts JSON POST requests and checks their origin and body size.

---

### Architecture and database

The frontend handles interaction. The Vercel API handles email verification. Supabase Auth manages identity and sessions, while PostgreSQL persists each account's data.

| Component | Responsibility |
| --- | --- |
| React + `CloudStore` | In-memory state, save queue and conflict recovery |
| `/api/auth` | Email lookup, code generation/verification and administrative operations |
| EmailJS | Code delivery; it does not decide whether an account is verified |
| Supabase Auth | Sign-in email, password hash, identity and session |
| SQL + RLS | Per-user isolation, validation, transactions and revision control |
| Supabase Cron | Periodic cleanup of the send-rate history |

Main structures:

| Structure | Contents |
| --- | --- |
| `auth.users` | Supabase-managed identity |
| `public.profiles` | Account-linked display name |
| `public.lists` | Draft and saved lists, including planned dates |
| `public.list_items` | List products, categories, units and quantities |
| `public.purchases` | Active and completed purchases |
| `public.purchase_items` | Purchase items, prices, checked state and origin |
| `public.data_versions` | Data revision and last operation identifier |
| `lc_private.verification_attempts` | Private attempt state and HMAC verifiers |
| `lc_private.email_sends` | Private send-rate records |
| `lc_private.last_codes` | HMAC identifier of the previous code per email |

The `lc_load_data` and `lc_save_data` functions use the authenticated identity. The browser has no permission to write directly to the tables. `lc_auth_email_exists` returns only a boolean and is restricted to server use.

Versioned SQL lives in [supabase](supabase). [ARQUITETURA.md](docs/ARQUITETURA.md) documents the detailed decisions and limitations in Portuguese.

---

### Synchronization and legacy data

- Changes enter a serial queue and are saved per account.
- Each write includes an expected revision and an operation identifier to prevent silent overwrites and duplicate retries.
- If another device saved a newer version, the app reports a conflict and offers a **JSON copy of the current edit** or a reload from the cloud.
- Connection failures can be retried; unsynchronized changes remain in the tab's memory.
- Updates are fetched when protected screens open and when the window regains focus without pending edits.
- Where supported, the browser warns before leaving with unsynchronized changes.

Compatible legacy lists can be imported from the current browser's `localStorage`, **only for the same email and only while the cloud account has no existing data**. Local copies are preserved. Old users, passwords, codes and authentication flags are never imported.

> This is not an offline-first application or a real-time collaborative editor. Closing the tab without connectivity can lose unsynchronized changes. Wait for “Dados sincronizados” or download the copy offered after a failure.

---

### Email verification and security

- The server generates codes with `crypto.randomInt`, bound to the email, purpose and attempt.
- The expected code is never returned to the browser; private tables store HMAC verifiers.
- The password is not sent when verification starts. The account and profile are created only after confirmation.
- Public Supabase sign-ups must stay disabled; administrative account creation runs server-side only.
- Early lookup avoids sending codes for existing accounts; final duplicate-account handling remains for concurrent registrations.
- Recovery exchanges the verified code for a separate, single-use authorization to reset the password.
- Private keys never use the `VITE_` prefix, are not bundled into browser code and must not be committed.
- RLS isolates user data; changing a `localStorage` flag does not grant access.
- The API validates origin, request format and body size, and omits sensitive details from logs.

#### Current code policy

| Rule | Behavior |
| --- | --- |
| Format | Four digits, including leading zeros |
| Usage | Single-use and bound to an attempt |
| Time validity | No time-based expiration |
| Incorrect codes | Five errors terminate the attempt |
| Sends | Up to three requests per email in 45 minutes, shared by registration and recovery |
| Repetition | The immediately previous code for the same email is not reused |
| Resending | No resend button or expiration countdown |
| Leaving the screen | Requests cancellation; opening the email app does not cancel |
| Cleanup | Old send-rate records removed every five minutes; verification codes do not expire |

Abrupt browser closure can prevent cancellation and leave orphaned attempts. Failures after a send reservation count toward the limit because a timeout does not prove that no email was delivered.

The “account exists” response reveals email membership. There is no dedicated limit for these rejected lookups or a global defense against distributed email spending. Four-digit codes without expiration are a simplified project choice, **not a recommendation for sensitive applications**.

---

### Configuration and local development

Requirements: **Node.js 24 recommended**, npm, a Supabase project, and an EmailJS service/templates. The detailed setup guide is [CONFIGURACAO.md](docs/CONFIGURACAO.md), in Portuguese.

```bash
git clone https://github.com/Marcus-W-Camargo/liste-e-compre.git
cd liste-e-compre
npm ci
```

#### 1. Prepare Supabase

For an initial installation, execute these scripts in the SQL Editor as `postgres`, in order:

| Order | Script | Purpose |
| --- | --- | --- |
| 1 | [01-auth.sql](supabase/01-auth.sql) | Profiles, attempts and verification |
| 2 | [02-lists.sql](supabase/02-lists.sql) | Lists, purchases, isolation and synchronization |
| 3 | [03-cleanup.sql](supabase/03-cleanup.sql) | Scheduled cleanup using `pg_cron` |
| 4 | [04-email-precheck.sql](supabase/04-email-precheck.sql) | Account lookup before registration email delivery |

Disable **Allow new users to sign up** in Supabase Auth and keep the Email provider enabled. The four-digit code belongs to this application; it does not use Supabase's OTP or email templates.

If the integration is already installed and only the early lookup is missing, run **script 04 only**. Do not recreate the project or delete data.

#### 2. Configure the environment

Copy [.env.example](.env.example) to `.env.local` without overwriting existing configuration, then fill in:

| Variable | Purpose | Visibility |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL | Public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` key | Public |
| `SUPABASE_URL` | Same URL as the frontend | Server |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` key | Secret |
| `AUTH_VERIFICATION_SECRET` | Random secret for HMAC verifiers | Secret |
| `APP_ORIGIN` | Allowed application origin | Server |
| `EMAILJS_PUBLIC_KEY` | EmailJS account identifier | Server |
| `EMAILJS_PRIVATE_KEY` | Private EmailJS authentication | Secret |
| `EMAILJS_SERVICE_ID` | Sending service | Server |
| `EMAILJS_TEMPLATE_CADASTRO_ID` | Registration template | Server |
| `EMAILJS_TEMPLATE_RECUPERACAO_ID` | Recovery template | Server |

Generate the verification secret locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Use `APP_ORIGIN=http://127.0.0.1:5173` locally. Never publish secret values.

In EmailJS, allow non-browser API calls and require the private key. Templates receive `to_email`, `nome` and `codigo`; recovery also receives `recuperar`.

#### 3. Check and run

```bash
npm run check:config
```

This checks configuration, Supabase Auth and RPCs without sending email or creating an account. It does not validate actual delivery or EmailJS templates.

In one terminal:

```bash
npm run dev:api
```

In another:

```bash
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite forwards `/api` to the local API on port `3001`. `npm run preview` alone does not start that API. Restart the processes after environment changes.

---

### Testing and quality

```bash
npm test
npm run build
npm run lint
```

The suite covers:

- registration, early lookup, verification, cancellation and recovery;
- rejection of altered codes, tokens and email addresses;
- failure handling without unintended email delivery;
- re-runnable SQL, permissions and account isolation;
- synchronization, conflicts, legacy imports and idempotent operations;
- React form interactions.

Tests use **PGlite and mocked networking**: no real emails, external accounts or secrets are required. The [ci.yml](.github/workflows/ci.yml) workflow runs tests, builds and linting on pull requests and `main`.

Real email delivery, hosted Supabase, Cron and device behavior still require testing in the configured environment.

---

### Vercel deployment

- Framework: **Vite**.
- Install command: `npm ci`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Node.js: **24.x**.
- API entry: `api/auth.js`.
- Production: [liste-e-compre.vercel.app](https://liste-e-compre.vercel.app/).

Set the variables for the appropriate **Preview** and **Production** environments. In production, use `APP_ORIGIN=https://liste-e-compre.vercel.app`.

`VITE_*` variables are included at build time, so changes require a new deployment. Preview permits the exact deployment URL; other aliases must match `APP_ORIGIN`. Preview and Production pointing at the same Supabase project share accounts, data and email-send limits.

[vercel.json](vercel.json) excludes `/api/*` from the SPA fallback, allowing direct application-route access without returning HTML for API requests.

---

### Project structure

| Path | Contents |
| --- | --- |
| [src/App.tsx](src/App.tsx) | Routes, layout and profile |
| [src/pages](src/pages) | Home, account, lists, shopping and history |
| [src/components](src/components) | Forms, cards, modals, menu and synchronization status |
| [src/hooks](src/hooks) | Authentication and list operations |
| [src/services](src/services) | API communication and cloud persistence |
| [src/utils](src/utils) | Session and list-operation adapters |
| [src/config/supabase.ts](src/config/supabase.ts) | Public Supabase client |
| [src/types](src/types) | Models and categories |
| [src/assets](src/assets) | Visual assets |
| [api/auth.js](api/auth.js) | Vercel function entry |
| [server](server) | HTTP validation, authentication flow and providers |
| [shared](shared) | Shared validation and synchronization queue |
| [supabase](supabase) | Installation and upgrade SQL |
| [scripts](scripts) | Local API and configuration diagnostics |
| [tests](tests) | Automated tests |
| [docs](docs) | Setup, architecture and limitations |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | Continuous integration |

---

### Author

Developed by [Marcus Camargo](https://github.com/Marcus-W-Camargo) for learning, web development practice and portfolio presentation.

---

### Roadmap — next steps

The following proposals are future work, without a committed delivery date.

- [ ] **Redesign the History page:** improve visual organization, navigation and purchase-detail presentation.
- [ ] **Build spending-chart cards for overall and category totals:** turn stored purchases into a visual overview of consumption and spending distribution.
- [ ] **Expand extra-item spending calculations:** build on the existing basic calculation, distinguish planned and additional spending, and highlight their impact on totals.
- [ ] **Improve responsiveness:** polish CSS and prioritize phones with better space usage, readability and touch controls.
- [ ] **Introduce an English version:** translate the interface and prepare text, dates and formatting for internationalization.
- [ ] **Bring the project to a mobile app:** evaluate the portability approach while retaining accounts and Supabase synchronization.

---

<p align="center">
  🛒 <strong>Liste e Compre</strong><br>
  Planeje sua lista. Acompanhe sua compra.<br>
  Plan your list. Track your shopping.
</p>
