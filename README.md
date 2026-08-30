# 🛒 Liste & Compre

> Planeje sua lista, acompanhe sua compra e consulte seu histórico.  
> Plan your list, track your shopping and review your purchase history.

[![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Database%20%2B%20Storage-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![CI](https://github.com/Marcus-W-Camargo/liste-e-compre/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Marcus-W-Camargo/liste-e-compre/actions/workflows/ci.yml)

🌐 **Acessar / Open:** [listeecompre.vercel.app](https://listeecompre.vercel.app/)

---

<a id="portugues"></a>

## 🇧🇷 Português (Brasil)

### Sobre o projeto

**Liste & Compre** é uma aplicação web para organizar o processo de compras do planejamento à conclusão. O usuário pode montar listas por categoria, definir quantidades e medidas, salvar e agendar listas, acompanhar preços durante a compra e consultar os registros depois da finalização.

A aplicação é uma SPA construída com **React 19 + TypeScript 6 + Vite 8**, usando **Supabase Auth, PostgreSQL e Storage**, funções serverless na **Vercel**, **EmailJS** para códigos de verificação e **Resend** para o canal de feedback da Central de Ajuda.

Listas, rascunhos e compras concluídas são sincronizados por conta. A **compra ainda não finalizada permanece somente no navegador atual**, em `localStorage`, isolada por usuário, até ser concluída. Essa decisão evita sincronizações desnecessárias durante uma compra presencial e mantém o fluxo simples para retomada no mesmo dispositivo.

---

### Diferenciais

O **Liste & Compre** foi pensado para acompanhar uma compra real do planejamento ao fechamento, indo além de uma checklist convencional.

- **Planejamento e execução no mesmo fluxo:** a lista criada antes da compra se transforma na própria tela de acompanhamento durante a compra.
- **Valores em tempo real:** preços, quantidades e totais são atualizados conforme os produtos são adicionados ao carrinho.
- **Unidades e peso:** suporte a produtos por unidade e quilograma, incluindo quantidades decimais para itens pesados.
- **Controle de extras:** produtos não planejados podem ser adicionados durante a compra e permanecem identificados no Histórico.
- **Retomada da compra:** uma compra ainda não finalizada fica preservada localmente no navegador para continuar depois no mesmo dispositivo.
- **Histórico reutilizável:** além de consultar compras anteriores, é possível visualizar seus itens e recriar uma nova lista a partir de uma compra já concluída.
- **Experiência por conta:** listas, rascunhos, histórico, perfil e orientações são separados por usuário.
- **Desktop e mobile:** a interface combina atalhos de teclado no computador com navegação por gestos em dispositivos móveis.
- **Central de Ajuda integrada:** guia visual, FAQ e envio de feedback fazem parte da própria aplicação.

---

### Fluxo principal

1. Cadastro ou login em uma conta autenticada.
2. Criação da lista com produtos, categorias, quantidades e medidas.
3. Salvamento, edição, renomeação, exclusão ou agendamento da lista.
4. Abertura da lista em **Compras** para iniciar a compra.
5. Registro de preços, quantidades, itens concluídos e produtos extras.
6. Preservação local da compra incompleta para retomada no mesmo navegador.
7. Tratamento dos itens pendentes antes da finalização.
8. Registro da compra concluída no Histórico.
9. Consulta dos itens antigos ou recriação de uma nova lista a partir de uma compra anterior.

---

### Tecnologias

| Camada | Tecnologia | Função |
| --- | --- | --- |
| Interface | React 19 | Componentes e telas |
| Linguagem | TypeScript 6 | Tipagem e segurança durante o desenvolvimento |
| Navegação | React Router 7 | Rotas e fluxo da SPA |
| Build | Vite 8 | Desenvolvimento e produção |
| Estilização | CSS | Interface responsiva |
| Autenticação | Supabase Auth | Contas e sessões |
| Banco | PostgreSQL / Supabase | Dados sincronizados por usuário |
| Arquivos | Supabase Storage privado | Fotos de perfil isoladas por conta |
| Persistência local | `localStorage` | Compra incompleta por usuário e navegador |
| API | Vercel Functions + Node.js | Autenticação auxiliar e feedback |
| Verificação por e-mail | EmailJS | Entrega de códigos de verificação |
| Feedback | Resend | Envio das mensagens da Central de Ajuda |
| Qualidade | Oxlint + Vitest + Node Test + GitHub Actions | Lint, testes e build |
| Hospedagem | Vercel | SPA e funções serverless |

---

### Funcionalidades atuais

#### Conta, autenticação e perfil

- Cadastro, login e recuperação de acesso.
- Código próprio de verificação de quatro dígitos entregue por e-mail.
- Proteção das páginas que exigem autenticação.
- Dados e sessões separados por conta.
- Página **Minha Conta** com nome, e-mail e foto de perfil.
- Upload de foto JPG/JPEG/PNG com editor de recorte e zoom.
- Foto final gerada em até **512 × 512 px** e otimizada para ficar abaixo de **200 KB** antes do upload.
- Foto armazenada em bucket privado do Supabase Storage com acesso isolado por usuário.
- URLs assinadas reutilizadas durante a sessão para reduzir transferências repetidas e aproveitar o cache do Storage/CDN.
- Alteração e exclusão da foto de perfil.
- Avatar sincronizado exibido também no botão de conta do cabeçalho, com o ícone padrão como fallback.
- Atualização do avatar no cabeçalho após alterar ou excluir a foto, sem exigir novo login.
- Avisos iniciais e orientações separados por conta.

#### Criação e gerenciamento de listas

- Produtos organizados por categoria, quantidade e medida.
- Biblioteca interna com mais de 900 produtos.
- Sugestões automáticas após três caracteres digitados.
- Busca de sugestões tolerante a acentos e diferenças entre maiúsculas e minúsculas.
- Possibilidade de adicionar produtos que não fazem parte da biblioteca interna.
- Categorias incluindo Mercearia, Açougue, Bebidas, Limpeza, Higiene e Outros.
- Suporte a **unidades (`un`)** e **quilogramas (`Kg`)**.
- Quantidades em quilogramas exibidas com três casas decimais.
- Filtro por categoria.
- Rascunho sincronizado por conta.
- Salvamento, edição, renomeação e exclusão de listas.
- Agendamento de data prevista para a compra.
- Confirmações visuais antes de exclusões destrutivas.

#### Compra em andamento

- Registro de preço e quantidade por item.
- Alternância de medida entre unidade e quilograma.
- Campos numéricos adaptados para uso em dispositivos móveis.
- Totais por item e total parcial atualizados durante a compra.
- Progresso da compra.
- Produtos extras adicionados durante a compra.
- Autocomplete também disponível para produtos extras.
- Tratamento dos itens ainda pendentes antes da finalização.
- Compra incompleta armazenada somente no `localStorage`, separada por usuário.
- Fechar a compra pelo X ou visitar o Histórico **não apaga o progresso atual**.
- Sessões remotas incompletas antigas podem ser migradas para o navegador atual.
- A compra incompleta não é incluída nos payloads normais de sincronização.
- Após finalização bem-sucedida, a sessão local é removida e a compra é registrada no Histórico.

#### Histórico de compras

- Compras finalizadas organizadas da mais recente para a mais antiga.
- Nome da lista, data, quantidade de itens, gastos extras e valor total.
- Total acumulado das compras exibido no topo da página.
- Preservação de quantidades, preços e origem dos itens planejados ou extras.
- Visualização dos itens de uma compra antiga em uma única lista, agrupada por categoria.
- Ação **Refazer a mesma compra**, que recria os itens de uma compra anterior na página de criação de lista sem reutilizar preços antigos.
- Confirmação antes de substituir uma lista que já esteja em criação.
- Retorno preservando o ponto de origem: Catálogo → Histórico → Catálogo; compra em andamento → Histórico → mesma compra; acesso direto → Catálogo.

#### Central de Ajuda e feedback

- Página autenticada **Central de Ajuda**.
- Guia interativo com demonstrações visuais do fluxo principal da aplicação.
- Passo a passo desde a criação da lista até o Histórico.
- FAQ com respostas para as dúvidas mais comuns.
- Seção **Fale com a gente** integrada à própria página.
- Envio de **elogio**, **reclamação** ou **relato de bug** sem sair do site.
- E-mail de contato opcional no formulário.
- Inclusão de informações básicas do navegador em relatos de bug para auxiliar no diagnóstico.
- Backend dedicado em `/api/feedback`, com validação de origem, limite de corpo e envio via Resend.
- Modais de feedback adaptados para desktop e mobile.

#### Interface e navegação

- Layout responsivo para desktop e celular.
- Cabeçalho, rodapé e fundo adaptados ao mobile.
- Background fixado à viewport para evitar mudanças de escala conforme o conteúdo cresce.
- Layout da compra compactado para melhor aproveitamento da largura em telas pequenas.
- Foto do usuário integrada ao menu de conta.
- Favicon próprio da aplicação.
- **Mobile:** navegação horizontal por swipe entre as telas principais.
- O swipe pode começar sobre cards, botões e áreas vazias; campos editáveis são protegidos.
- **Desktop:** `A` ou `←` navega para a esquerda; `D` ou `→` navega para a direita.
- `↑` e `↓` permanecem livres para scroll.
- Atalhos são ignorados enquanto o usuário estiver editando campos.
- Guia inicial específico para o dispositivo: gestos no mobile e teclas físicas no desktop.
- Mensagens rotineiras de sincronização reduzidas; erros e conflitos continuam visíveis.

---

### Rotas

| Rota | Acesso | Função |
| --- | --- | --- |
| `/` | Público | Página inicial |
| `/conta?modo=login` | Público | Login e recuperação |
| `/conta?modo=cadastro` | Público | Cadastro |
| `/lista` | Autenticado | Criação e edição de listas |
| `/compre` | Autenticado | Catálogo de listas salvas |
| `/compre/:listaId` | Autenticado | Compra em andamento |
| `/historico` | Autenticado | Histórico de compras |
| `/perfil` | Autenticado | Minha Conta e foto de perfil |
| `/ajuda` | Autenticado | Guia, FAQ e feedback |

---

### Sincronização, armazenamento e privacidade

- Listas, rascunhos e compras finalizadas são sincronizados por conta.
- Fotos de perfil são armazenadas em um bucket privado do Supabase Storage.
- Cada usuário acessa somente sua própria foto através das políticas configuradas no Storage.
- Novas fotos são reduzidas e comprimidas no navegador antes do upload.
- URLs assinadas das fotos são mantidas em cache de sessão e reutilizadas enquanto válidas.
- A compra incompleta permanece localmente no navegador atual.
- Cada conta possui sua própria chave de sessão local.
- Conflitos de sincronização continuam sendo informados ao usuário.
- A sessão local da compra só é removida após a finalização bem-sucedida.

> O projeto não é offline-first e não funciona como editor colaborativo em tempo real.

---

### Código-fonte, execução local e licença

O **Liste & Compre** foi desenvolvido como **protótipo, projeto de estudo e peça de portfólio**, sem finalidade comercial direta. O código-fonte pode ser consultado, estudado e reutilizado nos termos da **Licença MIT** incluída neste repositório.

Consulte [`LICENSE`](LICENSE) para o texto original em inglês e [`LICENSE.pt-br.md`](LICENSE.pt-br.md) para a tradução em português. O aviso de copyright e os termos da licença devem ser preservados conforme previsto pela própria MIT.

Para quem deseja estudar ou executar o projeto localmente, os requisitos são: **Node.js 24 recomendado**, npm, um projeto Supabase e credenciais dos serviços de e-mail utilizados pela aplicação.

```bash
git clone https://github.com/Marcus-W-Camargo/liste-e-compre.git
cd liste-e-compre
npm ci
npm run check:config
```

Para executar o frontend e a API local:

```bash
npm run dev:api
npm run dev
```

Para validar o projeto:

```bash
npm run catalog:generate
npm test
npm run build
npm run lint
```

---

### Deploy na Vercel

- Framework: **Vite**
- Instalação: `npm ci`
- Build: `npm run build`
- Saída: `dist`
- Runtime Node.js: compatível com `>=22.12.0` e recomendado em **24.x**
- Funções serverless: autenticação auxiliar e feedback
- Produção: [listeecompre.vercel.app](https://listeecompre.vercel.app/)

---

### Estrutura do projeto

| Caminho | Conteúdo |
| --- | --- |
| `src/App.tsx` | Rotas, layout e composição principal |
| `src/pages` | Telas da aplicação |
| `src/components` | Componentes, modais, avisos e feedback |
| `src/data` | Biblioteca interna gerada de produtos |
| `src/hooks` | Autenticação, swipe e navegação por teclado |
| `src/services` | API e persistência |
| `src/utils` | Sessão, Storage, histórico e navegação |
| `api` | Entradas das Vercel Functions |
| `server` | Handlers compartilhados das funções serverless |
| `data` | Catálogo-fonte em TXT e CSV gerado |
| `scripts/gerar-catalogo-produtos.mjs` | Gera CSV e biblioteca interna deduplicada |
| `supabase` | SQL e configuração relacionada ao banco |
| `tests` | Testes automatizados |
| `docs` | Documentação complementar |

---

### Roadmap — próximas evoluções

As propostas abaixo representam trabalho futuro e não possuem prazo de entrega definido.

- [ ] **Criar gráficos de gastos gerais e por categoria:** transformar os dados já armazenados no Histórico em visualizações para acompanhar consumo e distribuição dos gastos.
- [ ] **Aprofundar a análise de gastos extras:** comparar itens planejados e adicionados durante a compra, destacando com mais clareza o impacto dos extras no valor final.
- [ ] **Adicionar gerenciamento de credenciais dentro da Minha Conta:** permitir alteração de senha e evolução segura do fluxo de alteração de e-mail pelo próprio usuário.
- [ ] **Disponibilizar a interface em inglês:** internacionalizar textos, datas, valores e demais elementos da experiência do usuário.
- [ ] **Evoluir a presença e descoberta pública do projeto:** aprimorar metadados, SEO e integração do item “Sobre” com a página principal de portfólio.
- [ ] **Levar o projeto para um aplicativo de celular:** definir a estratégia de portabilidade/distribuição mobile preservando contas, dados sincronizados e a experiência já responsiva.

> A antiga proposta genérica de “evoluir o Histórico” não aparece mais no Roadmap porque a visualização detalhada dos itens e a ação de refazer uma compra já foram implementadas. As melhorias analíticas continuam listadas separadamente acima.

---

### Autor

Desenvolvido por [Marcus Camargo](https://github.com/Marcus-W-Camargo) como projeto de estudo, prática de desenvolvimento web e portfólio profissional.

---

<a id="english"></a>

## 🇺🇸 English

### About the project

**Liste & Compre** is a web application designed to organize the shopping process from planning to completion. Users can build categorized shopping lists, define quantities and units, save or schedule lists, track prices while shopping, and review completed purchases later.

The application is a SPA built with **React 19 + TypeScript 6 + Vite 8**, backed by **Supabase Auth, PostgreSQL and Storage**, serverless functions on **Vercel**, **EmailJS** for verification codes and **Resend** for the Help Center feedback channel.

Saved lists, drafts and completed purchases are synchronized by account. An **unfinished shopping session remains only in the current browser**, stored in `localStorage` and isolated by user until completion. This avoids unnecessary synchronization during an in-person shopping session and keeps same-device recovery straightforward.

---

### Key differentiators

**Liste & Compre** was designed to support a real shopping trip from planning through completion, rather than acting only as a conventional checklist.

- **Planning and shopping in one flow:** the list prepared beforehand becomes the live shopping interface.
- **Real-time values:** prices, quantities and totals update as products are added to the cart.
- **Units and weight:** products can be tracked by unit or kilogram, including decimal quantities for weighted items.
- **Extra-item tracking:** unplanned products can be added during shopping and remain identified in History.
- **Shopping-session recovery:** an unfinished purchase is kept locally so it can be resumed later in the same browser/device.
- **Reusable History:** users can inspect previous purchases and recreate a new editable list from a completed purchase.
- **Account-based experience:** lists, drafts, History, profile data and guidance are separated per user.
- **Desktop and mobile:** the interface combines keyboard navigation on desktop with gesture navigation on mobile devices.
- **Integrated Help Center:** the visual guide, FAQ and feedback channel are part of the application itself.

---

### Main flow

1. Sign up or log in to an authenticated account.
2. Build a shopping list with products, categories, quantities and units.
3. Save, edit, rename, delete or schedule the list.
4. Open the saved list in **Shopping** and start the purchase.
5. Record prices, quantities, completed items and extra products.
6. Keep an unfinished purchase locally for same-browser recovery.
7. Resolve pending items before completion.
8. Store the completed purchase in History.
9. Review previous items or recreate a new list from an earlier purchase.

---

### Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| UI | React 19 | Components and screens |
| Language | TypeScript 6 | Typing and development safety |
| Routing | React Router 7 | SPA navigation |
| Build | Vite 8 | Development and production builds |
| Styling | CSS | Responsive interface |
| Authentication | Supabase Auth | Accounts and sessions |
| Database | PostgreSQL / Supabase | Per-user synchronized data |
| Files | Private Supabase Storage | Account-isolated profile photos |
| Local persistence | `localStorage` | Unfinished purchase per user/browser |
| API | Vercel Functions + Node.js | Auxiliary authentication and feedback |
| Verification email | EmailJS | Verification-code delivery |
| Feedback | Resend | Help Center message delivery |
| Quality | Oxlint + Vitest + Node Test + GitHub Actions | Linting, tests and builds |
| Hosting | Vercel | SPA and serverless functions |

---

### Current features

#### Account, authentication and profile

- Account registration, login and access recovery.
- Custom four-digit verification code delivered by email.
- Protected authenticated routes.
- Per-account session and data separation.
- **My Account** page with name, email and profile photo.
- JPG/JPEG/PNG profile-photo upload with crop and zoom editor.
- Final avatar generated at up to **512 × 512 px** and optimized to remain below **200 KB** before upload.
- Profile photo stored in a private Supabase Storage bucket with per-user access isolation.
- Signed image URLs reused during the browser session to reduce repeated transfers and benefit from Storage/CDN caching.
- Profile-photo replacement and deletion.
- Synchronized avatar shown in the header account button, with the original user icon as fallback.
- Header avatar updates after changing or deleting a photo without requiring a new login.
- First-use messages and guidance stored separately by account.

#### List creation and management

- Products organized by category, quantity and unit.
- Internal library with more than 900 products.
- Product suggestions after three typed characters.
- Suggestions are tolerant of accents and letter casing.
- Custom product names remain supported when no suggestion is appropriate.
- Categories including Grocery, Butcher, Beverages, Cleaning, Hygiene and Other.
- Support for **units (`un`)** and **kilograms (`Kg`)**.
- Kilogram quantities displayed with three decimal places.
- Category filtering.
- Per-account synchronized draft.
- Save, edit, rename and delete saved lists.
- Planned shopping-date scheduling.
- Confirmation UI for destructive deletions.

#### Shopping session

- Per-item price and quantity entry.
- Unit/kilogram switching.
- Numeric fields adapted for mobile input.
- Per-item totals and partial total updates during shopping.
- Purchase progress tracking.
- Extra products added during the shopping session.
- Autocomplete also available for extra products.
- Pending-item handling before completion.
- Unfinished purchases stored only in `localStorage`, isolated by account.
- Closing the purchase with the X or visiting History **does not erase current progress**.
- Legacy unfinished remote sessions can be migrated to the current browser.
- The unfinished local session is excluded from normal synchronization payloads.
- After successful completion, local session data is removed and the purchase is added to History.

#### Purchase History

- Completed purchases ordered from newest to oldest.
- List name, date, item count, extra spending and purchase total.
- Accumulated spending total displayed at the top of the page.
- Quantity, price and planned/extra origin preserved for each item.
- Previous purchase items can be viewed in one list grouped by category.
- **Repeat the same purchase** recreates a previous purchase as a new editable list without copying old prices.
- Confirmation before replacing a list that is already being created.
- Origin-aware return navigation between Catalog, History and the active shopping session.

#### Help Center and feedback

- Authenticated **Help Center** page.
- Interactive guide with visual demonstrations of the main application flow.
- Step-by-step guidance from list creation through History.
- FAQ for common questions.
- Integrated **Talk to us** section.
- Send a **compliment**, **complaint** or **bug report** without leaving the site.
- Optional contact email in the feedback form.
- Basic browser information included with bug reports to help troubleshooting.
- Dedicated `/api/feedback` backend with origin validation, body-size limits and Resend delivery.
- Feedback dialogs adapted for desktop and mobile layouts.

#### Interface and navigation

- Responsive desktop and mobile layouts.
- Mobile-adapted header, footer and background.
- Viewport-fixed background to avoid scaling changes as page content grows.
- Compact shopping layout for better use of narrow screens.
- User avatar integrated into the account menu.
- Custom application favicon.
- **Mobile:** horizontal swipe navigation across the main screens.
- Swipes can start over cards, buttons and empty areas while editable fields remain protected.
- **Desktop:** `A` or `←` moves left; `D` or `→` moves right.
- `↑` and `↓` remain available for scrolling.
- Keyboard shortcuts are ignored while editing form fields.
- Device-specific first-use guide: gestures on mobile and physical keys on desktop.
- Routine synchronization messages are reduced while errors and conflicts remain visible.

---

### Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Home page |
| `/conta?modo=login` | Public | Login and recovery |
| `/conta?modo=cadastro` | Public | Registration |
| `/lista` | Authenticated | List creation and editing |
| `/compre` | Authenticated | Saved-list catalog |
| `/compre/:listaId` | Authenticated | Active shopping session |
| `/historico` | Authenticated | Purchase History |
| `/perfil` | Authenticated | My Account and profile photo |
| `/ajuda` | Authenticated | Guide, FAQ and feedback |

---

### Synchronization, storage and privacy

- Saved lists, drafts and completed purchases are synchronized per account.
- Profile photos are stored in a private Supabase Storage bucket.
- Storage policies restrict each user to their own profile photo.
- New profile photos are resized and compressed in the browser before upload.
- Signed profile-photo URLs are cached for the session and reused while valid.
- An unfinished purchase stays locally in the current browser.
- Each account has its own local shopping-session key.
- Synchronization conflicts remain visible to the user.
- Local unfinished-purchase data is removed only after successful completion.

> The project is not offline-first and is not a real-time collaborative editor.

---

### Source code, local setup and license

**Liste & Compre** was developed as a **prototype, study project and portfolio piece**, with no direct commercial purpose. Its source code can be reviewed, studied and reused under the **MIT License** included in this repository.

See [`LICENSE`](LICENSE) for the original English license and [`LICENSE.pt-br.md`](LICENSE.pt-br.md) for the Portuguese translation. The copyright notice and license terms must be preserved as required by the MIT License.

To study or run the project locally, the requirements are: **Node.js 24 recommended**, npm, a Supabase project and credentials for the email services used by the application.

```bash
git clone https://github.com/Marcus-W-Camargo/liste-e-compre.git
cd liste-e-compre
npm ci
npm run check:config
```

Run the frontend and local API:

```bash
npm run dev:api
npm run dev
```

Validate the project:

```bash
npm run catalog:generate
npm test
npm run build
npm run lint
```

---

### Vercel deployment

- Framework: **Vite**
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Node.js runtime: compatible with `>=22.12.0`, **24.x** recommended
- Serverless functions: auxiliary authentication and feedback
- Production: [listeecompre.vercel.app](https://listeecompre.vercel.app/)

---

### Project structure

| Path | Contents |
| --- | --- |
| `src/App.tsx` | Routes, layout and main composition |
| `src/pages` | Application screens |
| `src/components` | Components, dialogs, notices and feedback |
| `src/data` | Generated internal product library |
| `src/hooks` | Authentication, swipe and keyboard navigation |
| `src/services` | API and persistence |
| `src/utils` | Session, Storage, History and navigation utilities |
| `api` | Vercel Function entry points |
| `server` | Shared serverless handlers |
| `data` | TXT source catalog and generated CSV |
| `scripts/gerar-catalogo-produtos.mjs` | Generates the CSV and deduplicated internal catalog |
| `supabase` | SQL and database-related configuration |
| `tests` | Automated tests |
| `docs` | Additional documentation |

---

### Roadmap — next steps

The items below represent future work and do not have a committed delivery date.

- [ ] **Create overall and category spending charts:** turn existing History data into visual insights about consumption and spending distribution.
- [ ] **Deepen extra-spending analysis:** compare planned products with items added during shopping and make their impact on the final total clearer.
- [ ] **Add credential management inside My Account:** support password changes and a secure evolution of the self-service email-change flow.
- [ ] **Provide an English user interface:** internationalize text, dates, currency formatting and the rest of the user experience.
- [ ] **Improve public discovery and project presence:** enhance metadata, SEO and connect the “About” item to the main portfolio page.
- [ ] **Bring the project to a mobile app:** define a portability/distribution strategy while preserving accounts, synchronized data and the existing responsive experience.

> The former generic “expand History” roadmap item was removed because detailed purchase-item viewing and repeat-purchase actions are already implemented. Future analytical improvements remain listed separately above.

---

### Author

Developed by [Marcus Camargo](https://github.com/Marcus-W-Camargo) as a study project, web-development practice and professional portfolio project.

---

<p align="center">
  🛒 <strong>Liste & Compre</strong><br>
  Planeje sua lista. Acompanhe sua compra.<br>
  Plan your list. Track your shopping.
</p>
