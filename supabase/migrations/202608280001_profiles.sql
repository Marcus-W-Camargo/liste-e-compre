begin;

-- Execute em um projeto sem uma tabela profiles preexistente.
-- Falha sem sobrescrever dados se já existir uma tabela com esse nome.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (
    char_length(full_name) between 3 and 21
    and full_name ~ '^[[:alpha:]]+ [[:alpha:]]+$'
  ),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
create policy profiles_read_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create function public.lc_create_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is null then
    return new;
  end if;
  insert into public.profiles(id, full_name)
    values (new.id, new.raw_user_meta_data ->> 'full_name')
    on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.lc_create_profile() from public, anon, authenticated;
-- Auth insere e depois confirma o usuário na mesma transação de createUser.
create trigger lc_after_auth_user_created after insert or update of email_confirmed_at on auth.users
  for each row execute function public.lc_create_profile();

-- Lookup apenas no servidor, APÓS confirmação do código de recuperação.
-- Não duplicamos e-mail/senha na tabela de perfis.
create function public.lc_auth_user_id_by_email(p_email text)
returns uuid language sql stable security definer set search_path = '' as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;
revoke all on function public.lc_auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.lc_auth_user_id_by_email(text) to service_role;

commit;
