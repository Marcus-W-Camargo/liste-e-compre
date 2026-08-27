# Liste e Compre

Aplicação React + TypeScript + Vite para criar listas e acompanhar compras.

## Autenticação

Cadastro e recuperação com os templates EmailJS existentes e código de quatro dígitos, validado no servidor. O Upstash Redis guarda somente a verificação temporária protegida. O Supabase Auth recebe o cadastro **apenas depois da confirmação**.

**Antes de publicar:** siga [o guia de ativação](docs/ATIVACAO_AUTH.md). É necessário configurar Supabase, Redis e variáveis privadas da Vercel. Não mescle sem testar o Preview.

Nome e sobrenome ficam no mesmo campo, com um espaço e até 21 caracteres. Nomes podem repetir; e-mail é único no Supabase Auth. Senhas são gerenciadas pelo Auth, sem hashes locais.

As listas e históricos continuam locais ao navegador nesta etapa. Contas da versão antiga precisam de novo cadastro com confirmação; as listas não são apagadas.

## Desenvolvimento

Use Node 22 ou 24:

```sh
npm ci
npm run dev
```

Copie `.env.example` para `.env.local` e configure os valores sem versionar segredos. Em outro terminal, execute `npm run dev:api`. O frontend local abre em `http://127.0.0.1:5173`.

## Verificação

```sh
npm test
npm run build
npm run lint
```

Os testes não acessam serviços reais: usam provedores simulados, scripts Lua reais com comandos Redis simulados e PostgreSQL/PGlite local. A ativação exige também testar os provedores reais no Preview.

## Estrutura

- `src/`: interface e sessão Supabase.
- `api/auth.js`: entrada da função Vercel.
- `server/`: EmailJS, verificação e operações administrativas.
- `shared/`: regras de validação comuns.
- `supabase/migrations/`: perfis e políticas RLS.
- `tests/`: regressão de autenticação e banco.

Nunca exponha `SUPABASE_SECRET_KEY`, `EMAILJS_PRIVATE_KEY`, o token Redis ou `AUTH_VERIFICATION_SECRET` em variáveis `VITE_*`.
