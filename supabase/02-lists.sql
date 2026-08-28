-- Execute depois de 01-auth.sql. IDs antigos de listas/itens são preservados como texto.
begin;
create table if not exists public.data_versions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0,
  last_operation uuid
);
create table if not exists public.lists (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 100),
  kind text not null check (kind in ('draft','saved')),
  nome text not null check (length(nome)<=200),
  data timestamptz not null,
  data_prevista date,
  edicao_id text,
  position integer not null,
  primary key(user_id,id),
  check ((kind='draft' and id='__draft__') or (kind='saved' and id<>'__draft__' and length(trim(nome))>0))
);
create unique index if not exists lc_list_names on public.lists(user_id,lower(nome)) where kind='saved';
create table if not exists public.list_items (
  user_id uuid not null,
  list_id text not null,
  id text not null check (length(id) between 1 and 100),
  nome text not null check (length(nome) between 1 and 300),
  categoria text not null check (length(categoria)<=100),
  quantidade numeric not null check (quantidade>=0),
  tipo text not null check (tipo in ('un','Kg')),
  preco numeric check (preco>=0),
  comprado boolean not null default false,
  position integer not null,
  primary key(user_id,list_id,id),
  foreign key(user_id,list_id) references public.lists(user_id,id) on delete cascade
);
create table if not exists public.purchases (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 100),
  -- Sem FK à lista: o histórico sobrevive à remoção da lista original.
  lista_id text not null,
  nome_lista text not null check (length(nome_lista) between 1 and 200),
  data_inicio timestamptz not null,
  data_prevista date,
  data_fim timestamptz,
  valor_total numeric check (valor_total>=0),
  porcentagem_final numeric check (porcentagem_final between 0 and 100),
  gastos_adicionais numeric check (gastos_adicionais>=0),
  position integer not null,
  primary key(user_id,id)
);
create unique index if not exists lc_one_open_purchase on public.purchases(user_id) where data_fim is null;
create table if not exists public.purchase_items (
  user_id uuid not null,
  purchase_id text not null,
  id text not null check (length(id) between 1 and 100),
  nome text not null check (length(nome) between 1 and 300),
  categoria text not null check (length(categoria)<=100),
  quantidade numeric not null check (quantidade>=0),
  tipo text not null check (tipo in ('un','Kg')),
  preco numeric check (preco>=0),
  comprado boolean not null default false,
  preco_unitario numeric not null check (preco_unitario>=0),
  pego boolean not null,
  origem text not null check (origem in ('planejado','extra')),
  quantidade_planejada numeric check (quantidade_planejada>=0),
  position integer not null,
  primary key(user_id,purchase_id,id),
  foreign key(user_id,purchase_id) references public.purchases(user_id,id) on delete cascade
);

-- Leitura direta somente do dono. Escritas passam pela RPC transacional com revisão.
do $$ declare t text; begin
  foreach t in array array['data_versions','lists','list_items','purchases','purchase_items'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists lc_owner_read on public.%I',t);
    execute format('create policy lc_owner_read on public.%I for select to authenticated using (user_id=(select auth.uid()))',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
end $$;

create or replace function lc_private.list_item_json(i public.list_items) returns jsonb
language sql immutable set search_path='' as $$
 select jsonb_strip_nulls(jsonb_build_object('id',i.id,'nome',i.nome,'categoria',i.categoria,'quantidade',i.quantidade,'tipo',i.tipo,'preco',i.preco,'comprado',i.comprado))
$$;
create or replace function lc_private.purchase_item_json(i public.purchase_items) returns jsonb
language sql immutable set search_path='' as $$
 select jsonb_strip_nulls(jsonb_build_object('id',i.id,'nome',i.nome,'categoria',i.categoria,'quantidade',i.quantidade,'tipo',i.tipo,'preco',i.preco,'comprado',i.comprado,
 'precoUnitario',i.preco_unitario,'pego',i.pego,'origem',i.origem,'quantidadePlanejada',i.quantidade_planejada))
$$;
create or replace function lc_private.purchase_json(p public.purchases) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_strip_nulls(jsonb_build_object('id',p.id,'listaId',p.lista_id,'nomeLista',p.nome_lista,
 'dataInicio',p.data_inicio,'dataPrevista',p.data_prevista,'dataFim',p.data_fim,'valorTotal',p.valor_total,
 'porcentagemFinal',p.porcentagem_final,'gastosAdicionais',p.gastos_adicionais,
 'itens',coalesce((select jsonb_agg(lc_private.purchase_item_json(i) order by i.position) from public.purchase_items i where i.user_id=p.user_id and i.purchase_id=p.id),'[]'::jsonb)))
$$;

create or replace function public.lc_load_data() returns jsonb
language sql stable security definer set search_path='' as $$
 select case when auth.uid() is null then null else jsonb_build_object(
   'revision',coalesce((select revision from public.data_versions where user_id=auth.uid()),0),
   'data',jsonb_build_object(
     'itens',coalesce((select jsonb_agg(lc_private.list_item_json(i) order by i.position) from public.list_items i where i.user_id=auth.uid() and i.list_id='__draft__'),'[]'::jsonb),
     'edicaoId',(select edicao_id from public.lists where user_id=auth.uid() and kind='draft'),
     'historico',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
       'id',l.id,'nome',l.nome,'data',l.data,'dataPrevista',l.data_prevista,
       'itens',coalesce((select jsonb_agg(lc_private.list_item_json(i) order by i.position) from public.list_items i where i.user_id=l.user_id and i.list_id=l.id),'[]'::jsonb)
     )) order by l.position) from public.lists l where l.user_id=auth.uid() and l.kind='saved'),'[]'::jsonb),
     'sessao',(select lc_private.purchase_json(p) from public.purchases p where p.user_id=auth.uid() and p.data_fim is null),
     'compras',coalesce((select jsonb_agg(lc_private.purchase_json(p) order by p.position) from public.purchases p where p.user_id=auth.uid() and p.data_fim is not null),'[]'::jsonb)
   )
 ) end
$$;

create or replace function lc_private.insert_list_items(p_user uuid,p_list text,p_items jsonb) returns void
language sql set search_path='' as $$
 insert into public.list_items(user_id,list_id,id,nome,categoria,quantidade,tipo,preco,comprado,position)
 select p_user,p_list,i->>'id',i->>'nome',i->>'categoria',(i->>'quantidade')::numeric,i->>'tipo',
 (i->>'preco')::numeric,coalesce((i->>'comprado')::boolean,false),n
 from jsonb_array_elements(p_items) with ordinality as a(i,n)
$$;
create or replace function lc_private.insert_purchase(p_user uuid,p jsonb,p_position integer) returns void
language plpgsql set search_path='' as $$
begin
 if jsonb_typeof(p->'itens') is distinct from 'array' then raise exception 'invalid purchase items'; end if;
 insert into public.purchases(user_id,id,lista_id,nome_lista,data_inicio,data_prevista,data_fim,valor_total,porcentagem_final,gastos_adicionais,position)
 values(p_user,p->>'id',p->>'listaId',p->>'nomeLista',(p->>'dataInicio')::timestamptz,nullif(p->>'dataPrevista','')::date,
 (p->>'dataFim')::timestamptz,(p->>'valorTotal')::numeric,(p->>'porcentagemFinal')::numeric,(p->>'gastosAdicionais')::numeric,p_position);
 insert into public.purchase_items(user_id,purchase_id,id,nome,categoria,quantidade,tipo,preco,comprado,preco_unitario,pego,origem,quantidade_planejada,position)
 select p_user,p->>'id',i->>'id',i->>'nome',i->>'categoria',(i->>'quantidade')::numeric,i->>'tipo',(i->>'preco')::numeric,
 coalesce((i->>'comprado')::boolean,false),(i->>'precoUnitario')::numeric,(i->>'pego')::boolean,i->>'origem',(i->>'quantidadePlanejada')::numeric,n
 from jsonb_array_elements(p->'itens') with ordinality as a(i,n);
end $$;

create or replace function public.lc_save_data(p_expected_revision bigint,p_operation uuid,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid := auth.uid(); v public.data_versions%rowtype; l record;
begin
 if u is null then raise exception 'authentication required' using errcode='42501'; end if;
 if p_operation is null or p_expected_revision is null or p_data is null
   or jsonb_typeof(p_data)<>'object' or pg_column_size(p_data)>2097152
   or jsonb_typeof(p_data->'itens') is distinct from 'array'
   or jsonb_typeof(p_data->'historico') is distinct from 'array'
   or jsonb_typeof(p_data->'compras') is distinct from 'array'
   or not (p_data ? 'sessao') or jsonb_typeof(p_data->'sessao') not in ('object','null')
 then raise exception 'invalid data'; end if;
 insert into public.data_versions(user_id) values(u) on conflict do nothing;
 select * into v from public.data_versions where user_id=u for update;
 -- Repetir uma requisição cuja resposta se perdeu não duplica dados.
 if v.last_operation=p_operation then return jsonb_build_object('ok',true,'revision',v.revision); end if;
 if v.revision<>p_expected_revision then return jsonb_build_object('ok',false,'reason','conflict','revision',v.revision); end if;
 delete from public.lists where user_id=u;
 delete from public.purchases where user_id=u;
 insert into public.lists(user_id,id,kind,nome,data,edicao_id,position)
 values(u,'__draft__','draft','',now(),p_data->>'edicaoId',0);
 perform lc_private.insert_list_items(u,'__draft__',p_data->'itens');
 for l in select value as item,ordinality as pos from jsonb_array_elements(p_data->'historico') with ordinality loop
   if jsonb_typeof(l.item->'itens') is distinct from 'array' then raise exception 'invalid list'; end if;
   insert into public.lists(user_id,id,kind,nome,data,data_prevista,position)
   values(u,l.item->>'id','saved',l.item->>'nome',(l.item->>'data')::timestamptz,nullif(l.item->>'dataPrevista','')::date,l.pos);
   perform lc_private.insert_list_items(u,l.item->>'id',l.item->'itens');
 end loop;
 if jsonb_typeof(p_data->'sessao')='object' then
   if (p_data->'sessao'->>'dataFim') is not null then raise exception 'invalid session'; end if;
   perform lc_private.insert_purchase(u,p_data->'sessao',0);
 end if;
 for l in select value as item,ordinality as pos from jsonb_array_elements(p_data->'compras') with ordinality loop
   if (l.item->>'dataFim') is null then raise exception 'invalid purchase'; end if;
   perform lc_private.insert_purchase(u,l.item,l.pos::integer);
 end loop;
 update public.data_versions set revision=revision+1,last_operation=p_operation where user_id=u;
 return jsonb_build_object('ok',true,'revision',v.revision+1);
end $$;

revoke all on function public.lc_load_data() from public,anon;
revoke all on function public.lc_save_data(bigint,uuid,jsonb) from public,anon;
grant execute on function public.lc_load_data() to authenticated;
grant execute on function public.lc_save_data(bigint,uuid,jsonb) to authenticated;
revoke all on all functions in schema lc_private from public,anon,authenticated;
commit;
