# Arquitetura e limites desta versão

## Responsabilidades

| Parte              | Responsabilidade                                                                      |
| ------------------ | ------------------------------------------------------------------------------------- |
| React / Vite       | Formulários, exibição e edição das listas; não decide se um código é válido           |
| Vercel `/api/auth` | Gera e confere códigos, controla tentativas e chama a API administrativa              |
| EmailJS            | Entrega os templates existentes; não decide se uma conta foi confirmada               |
| Supabase Auth      | Identidade por e-mail, hashing de senha, login e sessões                              |
| PostgreSQL / RLS   | Dados por `auth.uid()`, transações de sincronização e controle privado de verificação |
| Supabase Storage   | Foto de perfil privada, limitada ao arquivo pertencente ao `auth.uid()`               |
| Supabase Cron      | Remove registros de envio antigos; não dá expiração aos códigos                       |

## Cadastro e recuperação

`start` recebe e-mail e nome, nunca senha. Após validar os dados e a configuração, no cadastro a Vercel consulta `lc_auth_email_exists` com o e-mail normalizado. A função retorna somente um booleano, lê `auth.users` (incluindo contas ainda não confirmadas) e só permite execução por `service_role`; `anon` e `authenticated` não têm acesso. Não grava conta, tentativa, histórico de envio ou último código, nem retorna UUID/perfil. A senha não participa da consulta.

Se a conta já existe, a API responde HTTP 409 / `CONTA_EXISTENTE` antes de gerar código ou reservar envio. O formulário mostra a mensagem sem abrir a verificação. Se a consulta falha ou retorna algo diferente de booleano, a API interrompe o processo sem chamar o EmailJS. Corrigir o endereço permite iniciar outra tentativa normalmente.

Para e-mail novo, a Vercel gera o código com `crypto.randomInt` e um token aleatório de 256 bits e segue a reserva/envio original. A API devolve só o identificador da tentativa e esse token; o código segue apenas no e-mail. A recuperação não passa pelo bloqueio de conta existente; sua lógica permanece inalterada.

No banco privado ficam HMACs com um segredo exclusivo do servidor, não hashes simples de quatro dígitos. O código é vinculado ao identificador, e-mail normalizado e propósito. O HMAC do token também é conferido. O e-mail legível, nome e senha não são persistidos nessas tabelas. O e-mail é, inevitavelmente, processado pelo provedor para fazer a entrega.

`confirm-signup` valida a senha e o nome, consome a autorização no SQL e só então cria a conta confirmada usando Supabase Auth. Nome e senha permanecem apenas no formulário até a confirmação; a senha trafega por HTTPS e não é salva em tabelas próprias.

A proteção de unicidade e o tratamento de conta duplicada na criação final permanecem: a consulta inicial não impede que outra tentativa crie a conta antes da confirmação. Nesse caso raro, um envio já pode ter sido consumido, mas a conta não é duplicada.

Na recuperação, `verify-recovery` consome o código e troca o token por uma autorização aleatória para `reset-password`. Esse segundo token também é de uso único e desaparece ao cancelar ou concluir. O código antigo não serve para redefinir a senha de novo.

A ordem de consumo privilegia uso único: se a chamada administrativa falhar depois do consumo, é preciso verificar se o cadastro concluiu e, se necessário, iniciar outra tentativa. Não há transação distribuída entre Postgres, EmailJS e Supabase Auth.

## Política combinada

- Quatro dígitos, incluindo zeros à esquerda; **sem expiração por tempo**.
- Máximo de cinco códigos incorretos por tentativa, com contagem atômica no banco.
- Três solicitações de envio por e-mail em janela móvel de 45 minutos, compartilhadas entre cadastro e recuperação. Reservas são serializadas por e-mail. Falhas posteriores à reserva contam, pois um timeout pode ocorrer depois da entrega.
- O número imediatamente anterior para o mesmo e-mail não se repete. Não mantemos histórico eterno por IP: quatro dígitos só oferecem 10.000 combinações e IPs podem ser compartilhados.
- Novo cadastro invalida a tentativa anterior de cadastro do mesmo e-mail; nova recuperação faz o equivalente para recuperação.
- Sair da tela, corrigir e-mail ou navegar para outra rota solicita cancelamento. `pagehide` usa `fetch` com `keepalive`. Nenhum token de tentativa é salvo em localStorage/sessionStorage. Voltar à tela requer nova tentativa.
- Não cancelar em `blur`/`visibilitychange`: o usuário precisa poder abrir o aplicativo de e-mail no celular.
- Sem botão de reenvio e sem contador de validade. Uma mensagem de limite pode informar a espera necessária para nova solicitação, sem invalidar por idade um código já emitido.

## O que é apagado e o que permanece

| Registro                  | Conteúdo                                              | Remoção                                                                                     |
| ------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `verification_attempts`   | ID, HMACs, finalidade, etapa, erros e data de criação | Cadastro concluído, reset concluído, cancelamento entregue, substituição ou quinto erro     |
| `email_sends`             | ID, identificador HMAC do e-mail e horário            | Deixa de contar aos 45 minutos; limpeza física a cada 5 minutos                             |
| `last_codes`              | Identificador HMAC do e-mail e HMAC do último número  | Substituído no próximo envio; não é apagado no cancelamento                                 |
| `auth.users` e `profiles` | Conta e nome após confirmação                         | Persistem para o acesso às listas                                                           |
| Listas e compras          | Dados separados por usuário                           | Conforme operações normais do site; excluir a conta no Supabase remove os dados por cascade |

Fechar o processo do navegador, ficar sem rede ou desligar o celular pode impedir a entrega do cancelamento. Sem expiração nem heartbeat, o servidor não consegue provar que a tela foi abandonada. Nessas situações podem permanecer tentativas privadas órfãs; a próxima tentativa do mesmo e-mail/finalidade substitui a anterior. Não prometemos remoção imediata em qualquer tipo de fechamento.

Uma aba modificada por quem a controla pode omitir o cancelamento ou guardar seu próprio token. Ela **não pode inventar uma confirmação válida** sem o código correto nem criar contas pelo cadastro público, que precisa ficar desativado. A validade não é decidida por flags do navegador. Quatro dígitos sem prazo continuam sendo uma escolha de segurança reduzida, não um modelo recomendado para aplicações sensíveis.

Não foram adicionados CAPTCHA, controle global de gasto ou um limite próprio por IP. O limite por e-mail não impede abuso distribuído usando muitos endereços. Para um lançamento amplo, reveja esses pontos e os limites do EmailJS/Vercel. Não registre senhas, códigos ou cabeçalhos de autenticação em observabilidade adicional.

Informar “conta existente” permite descobrir quais endereços possuem cadastro (enumeração de contas), uma escolha explícita deste fluxo. A consulta não é pública diretamente no Supabase, mas a resposta da API do site revela esse resultado. O limite de 3 envios/45 minutos **não limita essas consultas recusadas**, pois elas não reservam envio. Não há um novo limitador de consultas nesta alteração; o controle de abuso desse endpoint deve ser revisto antes de ampliar a exposição do projeto.

## Listas e sincronização

Os dados antes guardados no localStorage agora viram linhas em `lists`, `list_items`, `purchases` e `purchase_items`. Rascunhos e listas salvas são distintos. Cada compra conserva seus itens, inclusive extras, quantidades planejadas, preços e totais; o histórico não depende de a lista original ainda existir. O padrão existente de uma compra ativa por conta foi mantido.

A interface lê uma cópia em memória. Cada alteração é colocada numa fila serial. `lc_save_data` grava o conjunto da conta em uma transação, com revisão otimista e ID de operação para evitar duplicação caso a resposta se perca. A função obtém o dono de `auth.uid()`, nunca de um e-mail/ID arbitrário enviado pelo cliente. A aplicação não tem permissão para escrever diretamente nas tabelas.

Se outro dispositivo já salvou uma revisão mais recente, a gravação antiga é recusada antes de apagar qualquer dado. A edição local permanece nesta aba, com opções de baixar uma cópia e carregar a nuvem mediante confirmação. Não há merge automático nem colaboração em tempo real. Ao abrir as telas ou voltar o foco à janela, a aplicação consulta mudanças remotas quando não há edição pendente.

Essa estratégia é simples para o porte do projeto; regrava o conjunto da conta e limita seu payload SQL a 2 MiB. Para volume maior, a próxima evolução é persistir operações por lista/item, não remover a proteção de revisão.

Sem rede, alterações pendentes ficam **apenas na memória da aba**. O site avisa e permite tentar sincronizar/baixar cópia; não é uma aplicação offline-first. Logout espera a gravação; ao fechar a aba com edição pendente há aviso do navegador quando suportado. Não feche antes de “Dados sincronizados”.

Os tokens de sessão do Supabase são persistidos pelo SDK para manter login. Eles não são senhas, mas também precisam ser protegidos contra XSS. Alterar um objeto de sessão antigo não gera um JWT válido nem acesso às linhas de outro usuário.

## Foto de perfil

A foto recortada é convertida para JPEG de 512×512 e enviada ao bucket privado `profile-photos`. O caminho é determinístico: `<auth.uid()>/avatar.jpg`. As políticas de `SELECT`, `INSERT`, `UPDATE` e `DELETE` comparam o caminho completo com o UID autenticado; conhecer o e-mail ou o UUID de outra conta não concede acesso ao arquivo dela.

O bucket aceita somente JPEG e limita o objeto a 2 MiB. O navegador baixa a imagem usando o JWT da sessão, portanto não existe URL pública permanente. A versão anterior em `localStorage`, quando presente, é enviada uma única vez após o login e removida somente depois do upload bem-sucedido. Falhas de rede preservam essa cópia para nova tentativa.

## Importação e testes

Não importamos `usuarios_local`, hashes de senha, códigos, validações ou flags da implementação antiga. Depois de um cadastro real com o mesmo e-mail, quatro chaves de listas/compras do navegador são lidas e validadas. Só importamos quando a revisão remota é zero, com proteção de conflito. Dados incompatíveis são preservados sem importação automática. Não removemos cópias antigas do localStorage.

Os testes automatizados cobrem a API com provedores simulados, SQL e RLS em PostgreSQL/PGlite, sincronização concorrente e interação dos formulários em jsdom. Não equivalem a um teste real do Supabase hospedado, `pg_cron`, entrega EmailJS ou deployment Vercel. A conferência visual em navegador não foi concluída no ambiente de implementação, que bloqueou o endereço local; execute o roteiro manual no Preview, inclusive em celular.
