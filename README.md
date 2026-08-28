# Liste e Compre

Listas de compras com rascunho, categorias, agendamento, compra em andamento e histórico. Interface React + TypeScript + Vite; contas e dados no Supabase; verificação de e-mail em uma função da Vercel usando os templates existentes do EmailJS.

## Ativar esta versão

Siga o **[guia de configuração](docs/CONFIGURACAO.md)**. Ele contém os passos do Supabase, EmailJS, VS Code e Vercel, as variáveis e o roteiro de testes. Nenhuma chave privada deve entrar no Git.

Scripts SQL prontos, nesta ordem:

1. [Contas e verificações](supabase/01-auth.sql)
2. [Listas, itens e compras](supabase/02-lists.sql)
3. [Limpeza automática do controle de envios](supabase/03-cleanup.sql)

Use um projeto novo do Supabase. Os scripts não criam usuários de teste nem alteram dados de projetos antigos. A criação pública de usuários no Supabase precisa ficar desativada: a API da Vercel cria a conta somente depois de confirmar o código.

## Desenvolvimento

Node.js 24 recomendado. Depois de preencher `.env.local` conforme [.env.example](.env.example):

```bash
npm ci
npm run check:config
```

Em dois terminais:

```bash
npm run dev:api
```

```bash
npm run dev
```

Abra `http://127.0.0.1:5173`. A API local está na porta 3001; o Vite encaminha `/api` para ela. Não é preciso instalar a CLI da Vercel. `npm run preview` sozinho não inicia a API.

## Verificar o código

```bash
npm test
npm run build
npm run lint
```

Os testes usam PostgreSQL local em PGlite e rede simulada. Não enviam e-mails, não criam contas externas e não exigem segredos. Há testes da API, SQL/RLS, fila de sincronização e formulários React. A entrega real de e-mail e a configuração do projeto hospedado precisam do teste manual do guia.

## Decisões importantes

- Código de quatro dígitos, uso único, sem expiração por tempo e sem botão de reenvio.
- Cinco erros encerram a tentativa. Três solicitações de envio por e-mail em 45 minutos, somando cadastro e recuperação.
- Nome em um único campo: duas partes, um espaço, até 21 caracteres. Nomes podem se repetir; a identidade é o e-mail no Supabase Auth.
- Sair da verificação solicita o cancelamento; abrir o app de e-mail não cancela. Fechamento abrupto não garante entrega do cancelamento ao servidor.
- Senhas não são salvas em tabelas próprias: Supabase Auth faz o hashing. O cadastro só é criado após a confirmação.
- RLS e funções SQL restringem os dados ao usuário autenticado; flags antigas de localStorage não concedem acesso.
- Listas antigas compatíveis são importadas do navegador atual apenas para o mesmo e-mail e apenas se a conta ainda não possui dados na nuvem. Contas e senhas antigas não são importadas. As cópias locais são preservadas.
- Alterações simultâneas não sobrescrevem silenciosamente outro dispositivo. Um conflito oferece cópia da edição e recarga explícita.

Detalhes e limitações: [arquitetura e segurança](docs/ARQUITETURA.md).
