# Ativar Supabase + Vercel + EmailJS

O código está na branch `feat/supabase-integracao-v2`. Não faça merge na `main` antes de configurar e testar. A versão atual de produção deve continuar na `main` enquanto isso.

Você precisa somente das suas contas do Supabase, EmailJS e Vercel. Não é necessário Upstash, servidor separado, SMTP novo ou o código de seis dígitos do Supabase.

## 1. Criar o projeto Supabase

1. Crie um projeto **novo**, escolha uma região próxima e guarde a senha do banco em um gerenciador de senhas. Essa senha não é uma variável do aplicativo.
2. Aguarde o projeto ficar disponível. No **SQL Editor**, abra uma consulta nova e execute o conteúdo inteiro de cada arquivo, nesta ordem:

   | Ordem | Arquivo pronto                               | O que instala                                                             |
   | ----- | -------------------------------------------- | ------------------------------------------------------------------------- |
   | 1     | [01-auth.sql](../supabase/01-auth.sql)       | Perfil, controle privado das tentativas e funções de confirmação          |
   | 2     | [02-lists.sql](../supabase/02-lists.sql)     | Listas, itens, compras, histórico, isolamento por usuário e sincronização |
   | 3     | [03-cleanup.sql](../supabase/03-cleanup.sql) | Limpeza automática dos registros de envio após a janela de 45 minutos     |

   Não substitua valores dentro dos scripts. Eles já estão prontos. Execute como o usuário `postgres` do SQL Editor, não como `anon` ou `authenticated`.

3. Se o terceiro script indicar que `pg_cron` está indisponível, abra **Integrations → Cron**, habilite a extensão e execute novamente somente o terceiro script. Essa é a instalação documentada pelo [Supabase Cron](https://supabase.com/docs/guides/cron/install).
4. Em **Authentication → Sign In / Providers**, procure a configuração geral **Allow new users to sign up** e **desative**. Mantenha **Allow anonymous sign-ins** desativada e não habilite provedores sociais nesta versão.
5. Na configuração do provedor **Email**, mantenha **Enable email provider** ativada. Mantenha o mínimo da senha em **6**, sem selecionar requisitos adicionais que contradigam o formulário. As regras existentes são verificadas também na Vercel.

**Atenção:** desativar cadastros públicos não desativa o seu formulário. Ele usa a API administrativa somente no servidor após a prova de e-mail. Isso evita que alguém crie uma conta diretamente pelo console sem passar pela confirmação. A distinção está nas documentações de [configuração do Auth](https://supabase.com/docs/guides/auth/general-configuration) e [criação administrativa de usuário](https://supabase.com/docs/reference/javascript/auth-admin-createuser).

Não é necessário mudar **Confirm Email**, editar os templates de e-mail do Supabase ou configurar SMTP nele. A API cria a conta com o e-mail já confirmado após conferir o código do EmailJS. As configurações de expiração de OTP do Supabase não controlam este fluxo personalizado.

6. Na área **Connect** ou **Project Settings → API Keys**, obtenha:
   - URL do projeto: `https://SEU_PROJETO.supabase.co`.
   - **Publishable key**, começando com `sb_publishable_`.
   - **Secret key**, começando com `sb_secret_` — somente para o servidor.

Use as chaves do projeto novo. Não reutilize as chaves dos projetos excluídos. Não adicione `lc_private` aos schemas expostos pela Data API; o schema público padrão `public` é suficiente. Cadastre os usuários pelo formulário: criar manualmente pelo painel sem o metadado `full_name` não satisfaz o perfil obrigatório.

## 2. Conferir o EmailJS existente

1. Preserve seu serviço e os dois templates. Copie novamente os IDs e as chaves da **mesma conta**.
2. **Revogue a chave privada compartilhada anteriormente e gere outra.** Não envie a nova chave no chat, nem a coloque em commits ou capturas de tela.
3. Em **Account → Security / API Settings**, mantenha ativadas as opções de permitir chamadas de aplicativos não-browser e de exigir a chave privada. Salve as configurações. A chave privada é usada para autenticar o envio no servidor, conforme as [opções do EmailJS](https://www.emailjs.com/docs/sdk/options/).
4. Confira as variáveis dos templates; não é necessário mudar seu design:

   | Campo do template  | Cadastro       | Recuperação                           |
   | ------------------ | -------------- | ------------------------------------- |
   | **To Email**       | `{{to_email}}` | `{{to_email}}`                        |
   | Nome, se utilizado | `{{nome}}`     | `{{nome}}` (valor genérico “Usuário”) |
   | Código             | `{{codigo}}`   | `{{codigo}}` ou `{{recuperar}}`       |

O servidor envia os parâmetros pela [API `/send` do EmailJS](https://www.emailjs.com/docs/rest-api/send/). Não inclua senha, token de tentativa ou chave privada em nenhum template. Não habilite CAPTCHA obrigatório no template sem implementar o respectivo token: esse fluxo não o envia.

## 3. Preparar o teste no VS Code

Use Node.js **24** e abra o terminal PowerShell na pasta do projeto.

```powershell
git status
git fetch origin
git switch --track origin/feat/supabase-integracao-v2
npm ci
```

Se a branch já existir localmente, use `git switch feat/supabase-integracao-v2` e depois `git pull --ff-only`. Se `git status` mostrar alterações suas não salvas, preserve-as antes de trocar de branch; não use `reset --hard` ou exclusões para contornar isso.

Se ainda não existir um `.env.local`, crie uma cópia do modelo:

```powershell
Copy-Item .env.example .env.local
```

Se ele já existir, edite o arquivo existente: não o sobrescreva sem revisar. Remova variáveis antigas de Upstash e de autenticação que não aparecem no modelo. Nenhuma delas é necessária nesta versão.

Gere o segredo das verificações no seu próprio terminal:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Copie o resultado para `AUTH_VERIFICATION_SECRET`. Não publique esse resultado. Mantenha o mesmo segredo nas instâncias que usam o mesmo banco; alterá-lo invalida as tentativas existentes e reinicia a identificação do limite por e-mail.

Preencha o `.env.local` usando [.env.example](../.env.example):

| Variável                          | Valor a usar                           | Visibilidade |
| --------------------------------- | -------------------------------------- | ------------ |
| `VITE_SUPABASE_URL`               | URL do projeto novo                    | Pública      |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | Chave `sb_publishable_...`             | Pública      |
| `SUPABASE_URL`                    | Exatamente a mesma URL acima           | Servidor     |
| `SUPABASE_SECRET_KEY`             | Chave `sb_secret_...` do projeto novo  | **Secreta**  |
| `AUTH_VERIFICATION_SECRET`        | Resultado do comando de geração        | **Secreta**  |
| `APP_ORIGIN`                      | `http://127.0.0.1:5173` no teste local | Servidor     |
| `EMAILJS_PUBLIC_KEY`              | Public Key da conta EmailJS            | Servidor     |
| `EMAILJS_PRIVATE_KEY`             | Nova Private Key do EmailJS            | **Secreta**  |
| `EMAILJS_SERVICE_ID`              | ID do serviço existente                | Servidor     |
| `EMAILJS_TEMPLATE_CADASTRO_ID`    | ID do template de cadastro             | Servidor     |
| `EMAILJS_TEMPLATE_RECUPERACAO_ID` | ID do template de recuperação          | Servidor     |

Não copie os textos `COLE_...` como valores reais. O nome correto é **EMAILJS_SERVICE_ID**, não `MAILJS_SERVICE_ID`. Não use `NEXT_PUBLIC_`: este projeto usa Vite, não Next.js. Nunca adicione `VITE_` a variáveis privadas; elas seriam incluídas no JavaScript público.

Execute a checagem:

```powershell
npm run check:config
```

Ela verifica variáveis, conexão com Supabase Auth, bloqueio de cadastro público e disponibilidade da função de diagnóstico do SQL de autenticação. **Não envia e-mail, não cria conta e não comprova a validade das credenciais EmailJS.** Não substitui os testes abaixo.

Inicie o servidor em um terminal:

```powershell
npm run dev:api
```

Em outro terminal, inicie o site:

```powershell
npm run dev
```

Abra **http://127.0.0.1:5173**. Use esse endereço exato, não `localhost` misturado com `127.0.0.1`. Ao mudar variáveis, reinicie os dois processos com Ctrl+C e os comandos acima.

## 4. Testar antes de publicar

Use somente endereços de e-mail que você controla. A janela de 3 envios/45 minutos também vale para testes e soma cadastro e recuperação. Não faça muitas solicitações seguidas esperando que o botão reinicie o limite.

1. Cadastre um nome como `Maria Silva`, seu e-mail e uma senha nova que cumpra os requisitos. Na tela de código, ainda não deve existir usuário correspondente em **Authentication → Users** nem perfil em `public.profiles`.
2. Confira a chegada do e-mail e digite um código errado: não pode criar a conta. Depois digite o correto: a conta e o perfil devem aparecer. Faça login.
3. Crie lista, edite quantidades, renomeie, agende, inicie uma compra, informe preços e extras, teste a transferência de pendências e finalize. Aguarde **Dados sincronizados**, recarregue e confira o histórico e os totais.
4. Abra a mesma conta em outro navegador ou no Preview da Vercel: listas e histórico devem aparecer. Em outra conta, não devem aparecer dados da primeira.
5. Deixe a mesma lista aberta em dois navegadores. Edite e salve no primeiro; depois tente salvar uma edição antiga no segundo, sem recarregá-lo. O segundo deve mostrar conflito, com opção de baixar a edição ou carregar a nuvem, sem sobrescrever silenciosamente.
6. Teste recuperação quando houver cota: receba o código, confirme, defina outra senha e entre novamente.
7. Em outra tentativa, use **clique aqui para corrigir** ou volte à home. O código anterior deve ser cancelado. Ao começar novamente, o anterior não pode confirmar a nova tentativa. Apenas abrir o app de e-mail não deve cancelar.
8. Confira que não há contador de expiração nem botão de reenvio. Cinco códigos incorretos encerram a tentativa; a quarta solicitação de envio dentro da janela é recusada.

Há consultas prontas de conferência no final deste guia, sem exibir e-mails, senhas ou códigos.

**Dados locais antigos:** é necessário cadastrar novamente a conta, pois senhas e usuários antigos não são importados. Ao entrar com o mesmo e-mail, listas compatíveis do navegador atual são importadas apenas se a conta ainda estiver vazia na nuvem. O armazenamento depende do endereço do site: localhost e Vercel têm cópias distintas. Não limpe os dados do navegador; as cópias antigas são preservadas. Se já houver dados na nuvem ou a cópia local for incompatível, não fazemos sobrescrita automática.

## 5. Configurar a Vercel e testar o Preview

1. No projeto já conectado a este repositório, confira **Settings → Build and Deployment**: framework **Vite**, pasta raiz do repositório, instalação `npm ci`, build `npm run build`, saída `dist`, Node.js **24.x**. A raiz `api/auth.js` é a função de servidor; o roteamento está em `vercel.json`. Referências: [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite) e [versões de Node](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
2. Em **Settings → Environment Variables**, adicione as mesmas onze variáveis da tabela. Para o site publicado, use `APP_ORIGIN=https://liste-e-compre.vercel.app` — sem barra no final. As outras variáveis usam os valores novos já testados.
3. Aplique ao ambiente **Preview** e, quando for publicar, ao **Production**. Não coloque segredos em nomes iniciados com `VITE_`. Se usar o mesmo Supabase nos dois ambientes, o Preview altera **o mesmo banco real**; contas de teste e limites também são compartilhados. Para separação completa, use um segundo projeto Supabase, com scripts e valores próprios no Preview.
4. Faça **Redeploy** da branch nova após salvar as variáveis. Mudar uma variável não atualiza um deployment já pronto; as duas `VITE_...` são incorporadas no build.
5. Abra a URL exata desse deployment de Preview. A API permite automaticamente `https://VERCEL_URL` quando `VERCEL_ENV=preview`; não permite um curinga para qualquer domínio. Se usar outro alias, configure `APP_ORIGIN` do Preview para esse alias exato e faça novo deploy. Não é necessário criar manualmente as variáveis de sistema `VERCEL_URL` e `VERCEL_ENV`.
6. Repita cadastro/login e uma lista nesse Preview. Abrir `/api/auth` diretamente deve retornar JSON com **Método não permitido** (HTTP 405), não a página HTML. Isso é um teste de rota, não um envio de e-mail.
7. Só depois desses testes, marque o pull request como pronto e faça o merge na `main`. Confira que as variáveis de **Production** já estão configuradas antes do deploy de produção.

Não promova um build de Preview apontado para um banco de testes como se fosse Production: publique a `main` com as variáveis corretas. Não é preciso trocar de hospedagem nem criar uma API em outro serviço.

## Diagnóstico sem revelar credenciais

| Mensagem/sintoma                            | Onde conferir                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Autenticação não configurada                | `npm run check:config`, nomes das variáveis e placeholders; reinicie/redeploy                           |
| Cadastro seguro não configurado             | **Allow new users to sign up** precisa estar desligado; confira URL/chave e disponibilidade do Supabase |
| API não disponível ou HTML no lugar de JSON | Dois processos locais, proxy do Vite; na Vercel, função `/api/auth` e roteamento                        |
| Origem não permitida                        | `APP_ORIGIN` precisa corresponder ao endereço aberto, sem barra final                                   |
| EmailJS `CONTA_EMAILJS` / 404               | Chave pública, serviço e templates devem pertencer à mesma conta; leia só a categoria do log            |
| `CHAVE_PRIVADA_EMAILJS`                     | Chave nova correta, sem o texto de exemplo, e permissão de API no EmailJS                               |
| `SERVICO_EMAILJS` / `TEMPLATE_EMAILJS`      | Serviço conectado, IDs corretos e destinatário `{{to_email}}`                                           |
| `LIMITE_EMAILJS`                            | Cota da sua conta EmailJS; é independente do nosso limite de 3/45 minutos                               |
| Limite de 3 envios                          | Aguarde a janela indicada; cancelar, trocar de navegador ou reiniciar o servidor não devolve cota       |
| Falha ao carregar/sincronizar listas        | Script 02, URL/chave pública do mesmo projeto, conexão e sessão                                         |
| Conflito entre dispositivos                 | Baixe a edição antes de escolher carregar a nuvem                                                       |

Falhas de envio após a reserva da tentativa **contam para a janela de 45 minutos**: um timeout não prova que o provedor deixou de enviar. Erros detectados na pré-checagem de configuração não gastam a cota. Não há um limite arbitrário adicional de 1 minuto.

Os logs da função mostram apenas categoria e status; não imprimem código, corpo do formulário ou credenciais. Ao pedir ajuda, envie a categoria/HTTP e o passo que falhou, nunca seu `.env.local` completo.

## Consultas opcionais de conferência

Execute no SQL Editor como `postgres`. Todas são somente leitura.

```sql
-- RLS deve estar habilitado em todas estas tabelas.
select schemaname, tablename, rowsecurity
from pg_tables
where (schemaname = 'public' and tablename in
  ('profiles','data_versions','lists','list_items','purchases','purchase_items'))
   or schemaname = 'lc_private'
order by schemaname, tablename;

-- Totais, sem revelar os dados dos usuários.
select (select count(*) from auth.users) as contas,
       (select count(*) from public.profiles) as perfis,
       (select count(*) from lc_private.verification_attempts) as tentativas,
       (select count(*) from lc_private.email_sends) as registros_de_envio;

-- O job deve existir e estar ativo.
select jobname, schedule, active
from cron.job where jobname = 'lc-cleanup-sends';

-- Execuções recentes da limpeza; não altera nenhuma configuração.
select r.status, r.start_time, r.end_time
from cron.job_run_details r
join cron.job j on j.jobid = r.jobid
where j.jobname = 'lc-cleanup-sends'
order by r.start_time desc limit 5;
```

O Cron remove apenas o controle de envios fora da janela. Ele **não expira códigos**. Cancelamento/uso/substituição apagam a tentativa, mas fechamentos abruptos podem deixar registros privados órfãos. Essa limitação e o pequeno registro do último código estão descritos em [ARQUITETURA.md](ARQUITETURA.md).
