import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('migration: perfil após confirmação, limites, nomes repetidos e isolamento RLS', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text unique, email_confirmed_at timestamptz, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema auth to authenticated;
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/202608280001_profiles.sql', import.meta.url), 'utf8'));
  const first = '11111111-1111-4111-8111-111111111111';
  const second = '22222222-2222-4222-8222-222222222222';
  const insert = (id, name) => db.query('insert into auth.users values ($1, $2, null, $3)', [id, `${id}@example.test`, JSON.stringify({ full_name: name })]);
  await insert(first, 'João Silva');
  assert.equal((await db.query('select * from public.profiles')).rows.length, 0);
  await db.query('update auth.users set email_confirmed_at = now() where id = $1', [first]);
  await insert(second, 'João Silva');
  await db.query('update auth.users set email_confirmed_at = now() where id = $1', [second]);
  assert.equal((await db.query('select * from public.profiles')).rows.length, 2);

  await t.test('nomes inválidos falham na confirmação da conta', async () => {
    for (const name of ['Maria', 'Maria  Silva', 'Maria da Silva', 'Maria1 Silva', 'abcdefghijk klmnopqrst']) {
      await db.exec('begin');
      const id = '33333333-3333-4333-8333-333333333333';
      await insert(id, name);
      await assert.rejects(() => db.query('update auth.users set email_confirmed_at = now() where id = $1', [id]));
      await db.exec('rollback');
    }
  });
  await t.test('usuário só lê seu perfil, sem alterar/inserir ou consultar e-mails', async () => {
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${first}';`);
    assert.deepEqual((await db.query('select id from public.profiles')).rows, [{ id: first }]);
    await assert.rejects(() => db.query("update public.profiles set full_name='Outro Nome'"));
    await assert.rejects(() => db.query('select public.lc_auth_user_id_by_email($1)', [`${second}@example.test`]));
    await db.exec('reset role; set role anon;');
    await assert.rejects(() => db.query('select * from public.profiles'));
    await assert.rejects(() => db.query('select public.lc_auth_user_id_by_email($1)', [`${second}@example.test`]));
    await db.exec('reset role; set role service_role;');
    assert.equal((await db.query('select public.lc_auth_user_id_by_email($1) as id', [`${second}@example.test`])).rows[0].id, second);
    await db.exec('reset role;');
  });
});
