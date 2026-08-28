-- Execute no SQL Editor antes de publicar a verificação antecipada de cadastro.
-- Reexecutável: não cria tabelas, contas, tentativas nem registros de envio.
begin;

create or replace function public.lc_auth_email_exists(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(btrim(p_email))
  );
$$;

-- Inclui contas ainda não confirmadas: o e-mail já está ocupado no Auth.
-- Retorna somente booleano; nunca UUID, perfil, senha ou lista de usuários.
revoke all on function public.lc_auth_email_exists(text) from public, anon, authenticated;
grant execute on function public.lc_auth_email_exists(text) to service_role;

notify pgrst, 'reload schema';
commit;
