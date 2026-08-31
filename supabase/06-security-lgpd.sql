-- Execute depois de 01-auth.sql. Reexecutável. Registros guardam somente HMAC da origem e expiram automaticamente.
begin;
create table if not exists lc_private.rate_limits (
  scope text not null check (length(scope) between 1 and 50),
  source_key text not null check (source_key ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  primary key(scope, source_key)
);
alter table lc_private.rate_limits enable row level security;
revoke all on lc_private.rate_limits from public, anon, authenticated;

create or replace function public.lc_rate_limit(p_scope text,p_source_key text,p_limit integer,p_window_seconds integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r lc_private.rate_limits%rowtype; retry integer;
begin
 if p_scope is null or length(p_scope) not between 1 and 50
   or p_source_key !~ '^[a-f0-9]{64}$' or p_limit not between 1 and 1000
   or p_window_seconds not between 60 and 86400 then raise exception 'invalid rate limit'; end if;
 delete from lc_private.rate_limits where window_started_at <= now()-interval '24 hours';
 insert into lc_private.rate_limits(scope,source_key,window_started_at,request_count)
 values(p_scope,p_source_key,now(),1)
 on conflict(scope,source_key) do update set
   window_started_at=case when lc_private.rate_limits.window_started_at <= now()-make_interval(secs=>p_window_seconds) then now() else lc_private.rate_limits.window_started_at end,
   request_count=case when lc_private.rate_limits.window_started_at <= now()-make_interval(secs=>p_window_seconds) then 1 else lc_private.rate_limits.request_count+1 end
 returning * into r;
 if r.request_count > p_limit then
   retry := greatest(1,ceil(extract(epoch from r.window_started_at+make_interval(secs=>p_window_seconds)-now())));
   return jsonb_build_object('allowed',false,'retryAfter',retry);
 end if;
 return jsonb_build_object('allowed',true,'remaining',greatest(0,p_limit-r.request_count));
end $$;
revoke all on function public.lc_rate_limit(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.lc_rate_limit(text,text,integer,integer) to service_role;
commit;
