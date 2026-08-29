# 🛒 Liste e Compre

> Planeje sua lista, acompanhe sua compra e consulte seu histórico.  
> Plan your list, track your shopping and review your purchase history.

[![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Database-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![CI](https://github.com/Marcus-W-Camargo/liste-e-compre/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Marcus-W-Camargo/liste-e-compre/actions/workflows/ci.yml)

🌐 **Acessar / Open:** [liste-e-compre.vercel.app](https://liste-e-compre.vercel.app/)

---

<a id="portugues"></a>

## 🇧🇷 Português (Brasil)

### Sobre o projeto

**Liste e Compre** organiza compras do planejamento à conclusão. O usuário cria listas por categoria, informa quantidades, agenda uma data, acompanha preços e produtos durante a compra e consulta o histórico após finalizar.

A aplicação é uma SPA em **React + TypeScript**, construída com **Vite**, usando **Supabase Auth + PostgreSQL**, API na **Vercel** e códigos de verificação entregues pelo **EmailJS**.

Listas, rascunhos e compras finalizadas são sincronizados por conta. A **compra ainda não finalizada permanece somente no navegador atual**, em `localStorage`, isolada por usuário, até ser concluída.

---

### Como funciona

1. Cadastro e login por conta autenticada.
2. Criação de listas com produtos, categorias, quantidades e medidas.
3. Salvamento, edição, renomeação, exclusão e agendamento das listas.
4. Compra com preços, quantidades, marcação de itens e produtos extras.
5. Compra incompleta preservada localmente para retomada.
6. Tratamento de itens pendentes antes da finalização.
7. Compra concluída registrada no histórico e sincronizada.
8. Histórico com totais, extras e retorno para a tela de origem.

---

### Tecnologias

| Camada | Tecnologia | Função |
| --- | --- | --- |
| Interface | React 19 | Componentes e telas |
| Linguagem | TypeScript 6 | Tipagem |
| Navegação | React Router 7 | Rotas e sessões |
| Build | Vite 8 | Desenvolvimento e produção |
| Estilização | CSS | Interface responsiva |
| Autenticação | Supabase Auth | Contas e sessões |
| Banco | PostgreSQL / Supabase | Dados sincronizados |
| Persistência local | `localStorage` | Compra incompleta por conta |
| API | Vercel Functions + Node.js | Cadastro e recuperação |
| E-mail | EmailJS | Códigos de verificação |
| Qualidade | Oxlint + GitHub Actions | Lint, testes e build |
| Hospedagem | Vercel | SPA e API |

---

### Funcionalidades atuais

#### Conta e acesso

- Cadastro, login, recuperação de senha e perfil.
- Código de verificação de quatro dígitos.
- Proteção das páginas autenticadas.
- Avisos iniciais separados por conta.
- Aviso de conexão após a primeira lista salva.

#### Listas

- Produtos com categoria, quantidade e medida.
- **Unidades (`un`)** e **quilogramas (`Kg`)**.
- Pesos exibidos com três casas decimais.
- Filtro por categoria.
- Rascunho sincronizado.
- Salvar, editar, renomear e excluir listas.
- Agendamento de data prevista.

#### Compra em andamento

- Preço, quantidade, marcação e troca de medida.
- Totais por item e total parcial.
- Progresso da compra.
- Produtos extras.
- Tratamento de itens pendentes.
- Compra incompleta armazenada somente no `localStorage`, separada por conta.
- Fechar pelo X ou visitar o Histórico **não apaga o progresso**.
- Sessões remotas incompletas antigas podem ser migradas para o navegador.
- A sessão incompleta não é enviada nos payloads de sincronização.
- Ao finalizar com sucesso, a sessão local é removida e a compra entra no histórico.

#### Histórico

- Compras finalizadas da mais recente para a mais antiga.
- Data, itens, extras, total por compra e total acumulado.
- Preservação de quantidades, preços e origem planejada/extra.
- Layout adaptado a históricos curtos e longos.
- Retorno preservando a origem:
  - Catálogo → Histórico → Catálogo.
  - Compra em andamento → Histórico → mesma compra.
  - Acesso direto → Catálogo.

#### Interface e navegação

- Layout responsivo para desktop e celular.
- Cabeçalho, rodapé e fundo adaptados ao mobile.
- Compra compactada para melhor uso da largura no celular.
- **Mobile:** swipe horizontal em Lista ⇄ Compras ⇄ Histórico.
- O swipe pode começar sobre cards, botões e espaços vazios; campos editáveis são protegidos.
- **Desktop:** `A` ou `←` navega para a esquerda; `D` ou `→` navega para a direita.
- `↑` e `↓` continuam livres para o scroll.
- Atalhos são ignorados em campos editáveis.
- Guia inicial próprio para cada dispositivo: gesto no mobile e teclas físicas no desktop.
- Mensagens rotineiras de sincronização foram reduzidas; erros e conflitos continuam visíveis.

---

### Rotas

| Rota | Acesso | Função |
| --- | --- | --- |
| `/` | Público | Página inicial |
| `/conta?modo=login` | Público | Login e recuperação |
| `/conta?modo=cadastro` | Público | Cadastro |
| `/lista` | Autenticado | Criação e edição |
| `/compre` | Autenticado | Catálogo |
| `/compre/:listaId` | Autenticado | Compra em andamento |
| `/historico` | Autenticado | Histórico |
| `/perfil` | Autenticado | Conta |
| `/ajuda` | Autenticado | Ajuda |

---

### Sincronização e persistência

- Listas, rascunhos e compras finalizadas são sincronizados por conta.
- A compra incompleta fica localmente no navegador atual.
- Cada conta possui sua própria sessão local.
- Conflitos de sincronização continuam sendo informados.
- A sessão local é removida somente após finalização bem-sucedida.

> O projeto não é offline-first nem um editor colaborativo em tempo real.

---

### Configuração e execução local

Requisitos: **Node.js 24 recomendado**, npm, Supabase e EmailJS.

```bash
git clone https://github.com/Marcus-W-Camargo/liste-e-compre.git
cd liste-e-compre
npm ci
npm run check:config
```

Para executar:

```bash
npm run dev:api
npm run dev
```

Para validar:

```bash
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
- Node.js: **24.x**
- API: `api/auth.js`
- Produção: [liste-e-compre.vercel.app](https://liste-e-compre.vercel.app/)

---

### Estrutura do projeto

| Caminho | Conteúdo |
| --- | --- |
| `src/App.tsx` | Rotas e layout |
| `src/pages` | Telas |
| `src/components` | Componentes e avisos |
| `src/hooks` | Autenticação, swipe e teclado |
| `src/services` | API e persistência |
| `src/utils` | Sessão, storage e navegação |
| `api/auth.js` | API Vercel |
| `supabase` | SQL |
| `tests` | Testes |
| `docs` | Documentação |

---

### Autor

Desenvolvido por [Marcus Camargo](https://github.com/Marcus-W-Camargo) para estudo, prática de desenvolvimento web e portfólio.

---

### Roadmap — próximas evoluções

As propostas abaixo representam trabalho futuro, sem prazo de entrega definido.

- [ ] **Evoluir o Histórico de compras:** ampliar o detalhamento e a apresentação das compras finalizadas, oferecendo uma consulta mais completa dos registros.
- [ ] **Criar gráficos de gastos gerais e por categoria:** transformar os dados do histórico em visualizações que facilitem a análise do consumo e da distribuição dos gastos.
- [ ] **Evoluir a análise de gastos extras:** aprofundar a comparação entre itens planejados e adicionais, destacando melhor o impacto dos extras no valor final da compra.
- [ ] **Disponibilizar uma versão em inglês:** internacionalizar a interface, incluindo textos, datas, valores e demais elementos necessários para a experiência em inglês.
- [ ] **Levar o projeto para um aplicativo de celular:** definir a estratégia de portabilidade e distribuição mobile, preservando as contas, os dados sincronizados no Supabase e a experiência já adaptada para telas de celular.

---

<a id="english"></a>

## 🇺🇸 English

### About

**Liste e Compre** covers the shopping flow from planning to purchase history. Saved lists, drafts and completed purchases are synchronized through Supabase. An unfinished shopping session stays locally in the current browser, isolated by account, until completion.

### Current features

- Authenticated accounts, recovery and profile.
- Categorized lists with units and kilograms.
- Three-decimal kilogram quantities.
- Shopping sessions with prices, quantities, checked items, extras and pending-item handling.
- Local unfinished purchase persistence per account.
- Completed-purchase history with totals and extra spending.
- Origin-aware navigation when returning from History.
- Responsive desktop and mobile layouts.
- **Mobile:** horizontal swipe through Lists ⇄ Shopping ⇄ History.
- **Desktop:** `A` or `←` moves left; `D` or `→` moves right.
- Navigation shortcuts ignore editable fields.
- Device-specific first-use navigation guidance.

### Technology stack

React 19 · TypeScript 6 · React Router 7 · Vite 8 · Supabase Auth · PostgreSQL · Vercel · EmailJS · GitHub Actions.

### Roadmap — next steps

The following proposals represent future work, without a committed delivery date.

- [ ] **Expand purchase History:** provide richer purchase details and a more complete way to review completed shopping records.
- [ ] **Create overall and category spending charts:** turn purchase-history data into visual insights about consumption and spending distribution.
- [ ] **Expand extra-spending analysis:** improve the comparison between planned and additional items and make their impact on the final purchase total clearer.
- [ ] **Introduce an English version:** internationalize the interface, including text, dates, currency formatting and the other elements required for an English-language experience.
- [ ] **Bring Liste e Compre to a mobile app:** define the portability and mobile distribution strategy while preserving accounts, Supabase synchronization and the responsive phone experience.

---

<p align="center">
  🛒 <strong>Liste e Compre</strong><br>
  Planeje sua lista. Acompanhe sua compra.<br>
  Plan your list. Track your shopping.
</p>
