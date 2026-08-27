# Ativar cadastro, login e recuperação reais

A integração está preparada no código, mas **não está ativa até configurar os serviços abaixo e testar o Preview**. Não mescle a branch na `main` antes disso. Não envie chaves privadas pelo chat, não as coloque no GitHub e não use o prefixo `VITE_` em segredos.

## O que mudou, em linguagem simples

O formulário envia nome e e-mail para nossa pequena API na Vercel. Ela gera o código de quatro dígitos e usa o mesmo EmailJS, serviço e templates existentes. A senha permanece apenas na memória do formulário até a confirmação.

O Upstash Redis funciona como uma anotação temporária: guarda identificadores e códigos protegidos com HMAC, prazo e tentativas. Não guarda nome, e-mail em texto legível ou senha. O desafio expira em dez minutos e é consumido uma única vez. Contadores antiautomação permanecem por até 24 horas.

Somente depois da confirmação o servidor acessa o Supabase para criar a conta com e-mail confirmado e senha gerenciada pelo Supabase Auth. O perfil contém um único campo `full_name`, limitado a 21 caracteres, duas partes e um espaço. Nomes podem repetir; a identidade é o UUID do Auth e o e-mail é único no Auth. Não há senha nem cópia de e-mail na tabela de perfis.

A recuperação também é confirmada pelo EmailJS antes de consultar o Supabase. Por isso, o template recebe `nome = Usuário` nessa etapa. Depois de validar o código, a autorização para trocar a senha dura cinco minutos e só funciona uma vez.

## 1. Preparar o Supabase

1. Abra o projeto correto no [painel do Supabase](https://supabase.com/dashboard/project/bnolngaytbjvvowjcdry).
2. No **SQL Editor**, execute uma vez o conteúdo de [`supabase/migrations/202608280001_profiles.sql`](../supabase/migrations/202608280001_profiles.sql). Ele cria `profiles`, a proteção de leitura por usuário e as funções internas. Se já existir uma tabela `profiles`, pare e peça revisão: o script falha sem sobrescrevê-la. Não apague tabelas para tentar executá-lo.
3. Em **Authentication → Sign In / Providers**, localize **Allow new users to sign up** e desabilite o cadastro público. **Mantenha Enable email provider ativado**, pois ele permite o login com senha. Mantenha login anônimo e provedores não utilizados desativados. A criação administrativa continuará disponível para nossa API. O próprio código recusa criar contas se detectar o cadastro público habilitado.
4. Não é necessário procurar/alterar o botão de confirmação nativa de e-mail nem configurar templates OTP no Supabase. A confirmação será feita pela nossa API com EmailJS.
5. Em **Project Settings → API Keys**, obtenha uma chave **secret** (ou a antiga `service_role`, se ainda estiver usando esse formato) e salve-a **somente nas variáveis da Vercel** como `SUPABASE_SECRET_KEY`. A publishable key já enviada é pública e não substitui essa chave administrativa.

O Auth armazena o hash da senha. Não fazemos SHA-256 no navegador. As regras existentes de seis caracteres, letra, número e símbolo foram mantidas; existe também limite de 72 bytes para não truncar senhas no bcrypt. Para uma etapa posterior, recomenda-se avaliar mínimo de oito caracteres e proteção contra senhas vazadas.

## 2. Conectar o armazenamento temporário

1. Abra [Upstash no Marketplace da Vercel](https://vercel.com/marketplace/upstash).
2. Selecione **Install** e o produto **Redis**. Use a opção de criar uma conta gerenciada pela Vercel ou vincular uma conta Upstash.
3. Crie um banco, confira o plano e os limites antes de confirmar; escolha o plano gratuito se estiver disponível para sua conta. Não é necessário contratar plano pago para começar a configurar. Não habilite upgrades automáticos sem revisar os custos.
4. Conecte-o ao projeto Vercel `liste-e-compre`. A integração adiciona as variáveis de conexão ao projeto. O código aceita `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, ou os nomes `KV_REST_API_URL` + `KV_REST_API_TOKEN`. Use o token com escrita, não o read-only.
5. Marque as variáveis como sensíveis. Nunca as exponha no frontend. Para Preview, prefira outro banco ou, no mínimo, outro `AUTH_REDIS_NAMESPACE`.

## 3. Permitir envio pelo servidor no EmailJS

Não troque o provedor, serviço, template ou formato dos códigos.

Em **Account → Security**, habilite chamadas de aplicações não-browser e a autorização com **private key/access token**. Guarde essa chave na Vercel como `EMAILJS_PRIVATE_KEY`. Se sua conta também atender outros sites, confira o impacto de exigir chave privada antes de mudar a configuração global.

A versão antiga deste próprio site também envia pelo navegador. Se uma opção do EmailJS bloquear esses envios, deixe esse bloqueio para a troca final de versão ou use configuração isolada no Preview. Não desative o serviço atual durante os testes.

Reutilize os mesmos IDs. Os parâmetros continuam `to_email`, `nome`, `codigo`; a recuperação também envia `recuperar`. Recomenda-se copiar os antigos valores `VITE_EMAILJS_*` para os nomes sem `VITE_` abaixo. Há compatibilidade temporária com os nomes antigos no servidor, mas o novo navegador não chama EmailJS diretamente.

## 4. Variáveis na Vercel

Em **Project → Settings → Environment Variables**, configure para o ambiente de Preview inicialmente. Não cole os valores no código.

| Nome | Valor / origem |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://bnolngaytbjvvowjcdry.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | A chave pública já informada na conversa |
| `SUPABASE_URL` | A mesma URL acima |
| `SUPABASE_SECRET_KEY` | Chave administrativa, somente servidor |
| `UPSTASH_REDIS_REST_URL` | URL inserida pela integração Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Token inserido pela integração Redis |
| `AUTH_VERIFICATION_SECRET` | Segredo aleatório de pelo menos 32 bytes, gerado abaixo |
| `AUTH_REDIS_NAMESPACE` | `preview` no Preview; `production` na produção |
| `AUTH_ADMIN_SIGNUPS_ONLY` | `true`, somente após concluir o passo 1.3 |
| `AUTH_EMAIL_DAILY_LIMIT` | `100` inicialmente; ajuste ao seu plano/uso EmailJS |
| `APP_ORIGIN` | `https://liste-e-compre.vercel.app` em produção; URL exata do Preview se necessário |
| `EMAILJS_PUBLIC_KEY` | Mesmo valor de `VITE_EMAILJS_PUBLIC_KEY` |
| `EMAILJS_SERVICE_ID` | Mesmo valor de `VITE_EMAILJS_SERVICE_ID` |
| `EMAILJS_TEMPLATE_CADASTRO_ID` | Mesmo template de cadastro atual |
| `EMAILJS_TEMPLATE_RECUPERACAO_ID` | Mesmo template de recuperação atual |
| `EMAILJS_PRIVATE_KEY` | Chave privada do EmailJS, somente servidor |

Os nomes `NEXT_PUBLIC_SUPABASE_*` não são utilizados pelo Vite. O hostname automático de cada deployment Vercel (`VERCEL_URL`) também é aceito pelo servidor. Não usamos curingas de origem.

Para gerar `AUTH_VERIFICATION_SECRET`, execute no seu computador com Node instalado e copie a saída diretamente para a Vercel (não envie pelo chat):

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Use Node 22 ou 24. Depois de configurar as variáveis, faça um **Redeploy do Preview** para incorporar as públicas ao build. O site publicado na `main` continua na versão anterior até o merge.

## 5. Testar antes do merge

Use e-mails que você controla. Testar implica enviar e-mails e criar contas reais após confirmar. Se possível, utilize projetos separados para Preview e produção.

- Enviar um cadastro: confirmar que ainda não existe usuário novo em **Supabase → Authentication → Users**.
- Conferir entrega no EmailJS, inclusive spam, sem alterar o template.
- Informar código errado: não pode criar conta. Após cinco tentativas, deve bloquear. Há também limite diário de dez verificações por e-mail, inclusive entre reenvios.
- Confirmar o código correto: conta e perfil aparecem juntos; nome permanece em um campo. Tentar cadastrar novamente o mesmo e-mail não pode criar duplicata.
- Entrar, atualizar a página, abrir diretamente `/lista` e depois sair; as páginas protegidas só devem abrir com sessão válida.
- Entrar com outra conta: não deve mostrar a lista da anterior. As listas ainda são locais ao navegador nesta etapa.
- Recuperar senha: o código deve ser validado antes de qualquer consulta no Supabase; a senha anterior deixa de funcionar e a nova permite entrar. O Auth encerra as sessões anteriores; tokens de acesso já emitidos podem valer até expirar.
- Reutilizar um código, trocar o e-mail durante a verificação e tentar redefinir senha sem código: tudo deve falhar.
- Conferir que `Allow new users to sign up` está desativado. Não testar bypass chamando signup com um e-mail de terceiros.

Não mescle enquanto houver falhas nesses testes. Um problema de rede após a confirmação pode consumir o código sem o navegador receber a resposta: tente login e, se necessário, solicite novo código. Nunca reutilizamos uma prova já consumida.

## Limites e dados antigos

- Código: quatro dígitos; dez minutos; até cinco tentativas por desafio e por e-mail em dez minutos; dez verificações por e-mail em 24 horas. O código fica vinculado ao e-mail, à finalidade e a um cookie HttpOnly.
- Envios: três por e-mail/hora, dez por IP/hora, intervalo mínimo de 60 segundos por e-mail, um envio global/segundo e teto diário configurável. Essas proteções reduzem abuso, mas quatro dígitos são mais fracos que códigos maiores. Os limites do plano dos provedores continuam valendo; não prometemos ausência de custos em planos pagos.
- Se Redis/EmailJS/Supabase falhar, a operação é bloqueada; não existe fallback para autenticação local.
- Os usuários antigos de `usuarios_local` eram uma simulação no navegador. **Precisam se cadastrar novamente**, verificando o mesmo e-mail. Seus hashes não são importados e não concedem sessão real.
- As listas e históricos existentes não são apagados nem migrados nesta etapa. Continuam no dispositivo, associados ao mesmo e-mail. Eles ainda não têm sincronização entre dispositivos.
- As antigas chaves de autenticação no navegador não são lidas pelo código novo. Após verificar o funcionamento, você pode remover especificamente `usuarios_local`, `verificacoes_email`, `usuarioLogado`, `nomeUsuario`, `emailUsuario` e `timestampSessao` do armazenamento antigo. **Não use “limpar todo o armazenamento”**, pois apagaria as listas.

## Desenvolvimento e testes locais

Copie `.env.example` para `.env.local` e preencha localmente. Em dois terminais: `npm run dev` e `npm run dev:api`. Abra `http://127.0.0.1:5173` (a mesma origem de `APP_ORIGIN`). `npm run dev` sozinho não executa a API.

`npm test` executa a API com provedores simulados, os scripts reais em VM Lua com comandos Redis simulados e a migration em PostgreSQL/PGlite local. Não envia e-mails nem toca no projeto Supabase real. `npm run build` verifica TypeScript e build; `npm run lint` verifica o código. Ainda é indispensável testar a integração hospedada com os provedores reais antes de liberar para produção.

Referências: [Supabase createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [configuração Auth](https://supabase.com/docs/guides/auth/general-configuration), [EmailJS REST](https://www.emailjs.com/docs/rest-api/send/), [integração Upstash/Vercel](https://upstash.com/docs/redis/howto/vercelintegration).
