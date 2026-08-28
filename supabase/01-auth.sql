-- Execute em um projeto NOVO do Supabase, pelo SQL Editor, como postgres.
-- Reexecutável. Não altera auth.users nem cria contas de demonstração.
begin;
create schema if not exists lc_private;
revoke all on schema lc_private from public, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) <= 21 and full_name ~ '^[[:alpha:]]+ [[:alpha:]]+$')
);
alter table public.profiles enable row level security;
drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles for select to authenticated using (id = (select auth.uid()));
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;

create or replace function lc_private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
revoke all on function lc_private.create_profile() from public, anon, authenticated;
drop trigger if exists lc_create_profile on auth.users;
create trigger lc_create_profile after insert on auth.users for each row execute function lc_private.create_profile();

-- São HMACs feitos na Vercel. Nenhum nome, senha, e-mail legível, IP ou código puro.
create table if not exists lc_private.verification_attempts (
  id uuid primary key,
  email_key text not null check (email_key ~ '^[a-f0-9]{64}$'),
  purpose text not null check (purpose in ('cadastro','recuperacao')),
  token_mac text not null check (token_mac ~ '^[a-f0-9]{64}$'),
  code_mac text check (code_mac ~ '^[a-f0-9]{64}$'),
  stage text not null check (stage in ('sending','code','reset')),
  errors integer not null default 0 check (errors between 0 and 5),
  created_at timestamptz not null default now(),
  unique(email_key, purpose)
);
create table if not exists lc_private.email_sends (
  id uuid primary key,
  email_key text not null,
  sent_at timestamptz not null default now()
);
create index if not exists lc_sends_email_time on lc_private.email_sends(email_key, sent_at);
-- Mantida até a substituição: necessária para não repetir o número imediatamente anterior.
create table if not exists lc_private.last_codes (
  email_key text primary key,
  code_fingerprint text not null check (code_fingerprint ~ '^[a-f0-9]{64}$')
);
alter table lc_private.verification_attempts enable row level security;
alter table lc_private.email_sends enable row level security;
alter table lc_private.last_codes enable row level security;
revoke all on all tables in schema lc_private from public, anon, authenticated;

create or replace function public.lc_auth_health() returns boolean
language sql security definer set search_path = '' as $$ select true $$;

create or replace function public.lc_auth_start(
  p_id uuid, p_email_key text, p_purpose text, p_token_mac text, p_code_mac text, p_fingerprint text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare n integer; oldest timestamptz;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_email_key, 0));
  -- Janela móvel, compartilhada por cadastro e recuperação. Cancelar NÃO devolve cota.
  delete from lc_private.email_sends where email_key=p_email_key and sent_at <= now()-interval '45 minutes';
  select count(*), min(sent_at) into n, oldest from lc_private.email_sends where email_key=p_email_key;
  if n >= 3 then
    return jsonb_build_object('ok',false,'reason','rate_limit','retryAfter',greatest(1,ceil(extract(epoch from oldest+interval '45 minutes'-now()))));
  end if;
  if exists(select 1 from lc_private.last_codes where email_key=p_email_key and code_fingerprint=p_fingerprint) then
    return jsonb_build_object('ok',false,'reason','repeat');
  end if;
  delete from lc_private.verification_attempts where email_key=p_email_key and purpose=p_purpose;
  insert into lc_private.verification_attempts(id,email_key,purpose,token_mac,code_mac,stage)
    values(p_id,p_email_key,p_purpose,p_token_mac,p_code_mac,'sending');
  insert into lc_private.email_sends(id,email_key) values(p_id,p_email_key);
  insert into lc_private.last_codes values(p_email_key,p_fingerprint)
    on conflict(email_key) do update set code_fingerprint=excluded.code_fingerprint;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.lc_auth_activate(p_id uuid, p_token_mac text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update lc_private.verification_attempts set stage='code' where id=p_id and token_mac=p_token_mac and stage='sending';
  return found;
end $$;

create or replace function public.lc_auth_cancel(p_id uuid, p_token_mac text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  delete from lc_private.verification_attempts where id=p_id and token_mac=p_token_mac;
  return found;
end $$;

create or replace function public.lc_auth_verify(
  p_id uuid, p_email_key text, p_purpose text, p_token_mac text, p_code_mac text, p_reset_mac text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare a lc_private.verification_attempts%rowtype;
begin
  select * into a from lc_private.verification_attempts where id=p_id for update;
  if not found or a.email_key<>p_email_key or a.purpose<>p_purpose or a.token_mac<>p_token_mac or a.stage<>'code' then
    return jsonb_build_object('ok',false,'reason','invalid_attempt');
  end if;
  if a.code_mac<>p_code_mac then
    if a.errors+1 >= 5 then
      delete from lc_private.verification_attempts where id=p_id;
      return jsonb_build_object('ok',false,'reason','locked');
    end if;
    update lc_private.verification_attempts set errors=errors+1 where id=p_id;
    return jsonb_build_object('ok',false,'reason','wrong_code','remaining',4-a.errors);
  end if;
  if p_purpose='recuperacao' then
    if p_reset_mac is null then raise exception 'reset proof missing'; end if;
    -- O código deixa de existir; a autorização da próxima tela é uma prova aleatória separada.
    update lc_private.verification_attempts set stage='reset', code_mac=null, token_mac=p_reset_mac where id=p_id;
  else
    -- Consumo atômico: duas confirmações simultâneas nunca criam duas autorizações.
    delete from lc_private.verification_attempts where id=p_id;
  end if;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.lc_auth_consume_reset(p_id uuid, p_email_key text, p_token_mac text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  delete from lc_private.verification_attempts
    where id=p_id and email_key=p_email_key and token_mac=p_token_mac and purpose='recuperacao' and stage='reset';
  return found;
end $$;

create or replace function public.lc_auth_find_user(p_email text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users where lower(email)=lower(p_email) and email_confirmed_at is not null limit 1
$$;

create or replace function lc_private.cleanup_send_history() returns void
language sql security definer set search_path = '' as $$
  delete from lc_private.email_sends where sent_at <= now()-interval '45 minutes'
$$;
revoke all on function lc_private.cleanup_send_history() from public, anon, authenticated;

-- As RPCs administrativas não podem ser chamadas com a chave pública ou um JWT de usuário.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('lc_auth_health','lc_auth_start','lc_auth_activate','lc_auth_cancel','lc_auth_verify','lc_auth_consume_reset','lc_auth_find_user')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to service_role', f.signature);
  end loop;
end $$;
commit;
