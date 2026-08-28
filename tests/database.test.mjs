import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
let db;
const alice = '00000000-0000-4000-8000-000000000001',
  bob = '00000000-0000-4000-8000-000000000002';
before(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users(id uuid primary key, email text unique, email_confirmed_at timestamptz, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;`);
  for (const file of ['01-auth.sql', '02-lists.sql']) {
    const sql = await readFile(
      new URL(`../supabase/${file}`, import.meta.url),
      'utf8',
    );
    await db.exec(sql);
    await db.exec(sql); // Instalação reexecutável.
  }
  for (const [id, email, name] of [
    [alice, 'alice@example.com', 'Alice Silva'],
    [bob, 'bob@example.com', 'Bób Souza'],
  ]) {
    await db.query('insert into auth.users values($1,$2,now(),$3)', [
      id,
      email,
      JSON.stringify({ full_name: name }),
    ]);
  }
});
after(async () => {
  await db?.close();
});
async function roleQuery(role, uid, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
      uid ?? '',
    ]);
    return tx.query(sql, params);
  });
}
const blank = () => ({
  itens: [],
  historico: [],
  sessao: null,
  compras: [],
  edicaoId: null,
});
const item = {
  id: 'item-1',
  nome: 'Arroz',
  categoria: 'Mercearia',
  quantidade: 2,
  tipo: 'un',
  comprado: false,
};
const list = {
  id: 'lista-1',
  nome: 'Mercado',
  data: '2026-01-01T12:00:00.000Z',
  dataPrevista: '2026-01-05',
  itens: [item],
};
async function save(uid, revision, data, operation = randomUUID()) {
  const r = await roleQuery(
    'authenticated',
    uid,
    'select public.lc_save_data($1,$2,$3) as result',
    [revision, operation, JSON.stringify(data)],
  );
  return r.rows[0].result;
}
async function load(uid) {
  return (
    await roleQuery(
      'authenticated',
      uid,
      'select public.lc_load_data() as result',
    )
  ).rows[0].result;
}
test('schema privado e RPCs administrativas negam acesso a anon e authenticated', async () => {
  for (const role of ['anon', 'authenticated']) {
    await assert.rejects(
      roleQuery(role, alice, 'select * from lc_private.verification_attempts'),
      /permission denied/,
    );
    await assert.rejects(
      roleQuery(role, alice, 'select public.lc_auth_health()'),
      /permission denied/,
    );
    await assert.rejects(
      roleQuery(
        role,
        alice,
        "select public.lc_auth_find_user('alice@example.com')",
      ),
      /permission denied/,
    );
  }
  await assert.rejects(
    roleQuery('anon', null, 'select public.lc_load_data()'),
    /permission denied/,
  );
  await assert.rejects(
    roleQuery('authenticated', alice, 'delete from public.lists'),
    /permission denied/,
  );
  assert.equal(
    (
      await roleQuery(
        'service_role',
        null,
        'select public.lc_auth_health() as ok',
      )
    ).rows[0].ok,
    true,
  );
});
test('listas, rascunho e compra em andamento fazem round-trip sem misturar donos', async () => {
  const data = {
    ...blank(),
    itens: [{ ...item, id: 'draft' }],
    historico: [list],
    edicaoId: list.id,
    sessao: {
      id: 'sessao-1',
      listaId: list.id,
      nomeLista: list.nome,
      dataInicio: list.data,
      dataPrevista: list.dataPrevista,
      itens: [
        {
          ...item,
          precoUnitario: 10.5,
          pego: true,
          origem: 'planejado',
          quantidadePlanejada: 2,
        },
      ],
    },
  };
  assert.equal((await save(alice, 0, data)).revision, 1);
  const actual = (await load(alice)).data;
  assert.deepEqual(actual.itens, data.itens);
  assert.deepEqual(actual.sessao.itens, data.sessao.itens);
  assert.equal(actual.edicaoId, list.id);
  assert.equal(actual.historico[0].dataPrevista, '2026-01-05');
  assert.deepEqual((await load(bob)).data, blank());
  assert.equal(
    (await roleQuery('authenticated', bob, 'select * from public.lists')).rows
      .length,
    0,
  );
  assert.equal(
    (await roleQuery('authenticated', bob, 'select * from public.profiles'))
      .rows[0].full_name,
    'Bób Souza',
  );
});
test('conflito entre dispositivos não apaga dados; retry idempotente não duplica', async () => {
  assert.equal((await save(alice, 0, blank())).reason, 'conflict');
  assert.equal((await load(alice)).data.historico.length, 1);
  const operation = randomUUID();
  assert.equal(
    (
      await save(
        bob,
        0,
        { ...blank(), historico: [{ ...list, nome: 'Outra lista' }] },
        operation,
      )
    ).revision,
    1,
  );
  assert.equal((await save(bob, 0, blank(), operation)).revision, 1);
  assert.equal((await load(bob)).data.historico[0].nome, 'Outra lista');
});
test('finalizar remove lista e sessão, mas preserva itens e totais no histórico', async () => {
  const current = await load(alice);
  const compra = {
    ...current.data.sessao,
    dataFim: '2026-01-05T12:00:00Z',
    valorTotal: 21,
    porcentagemFinal: 100,
    gastosAdicionais: 0,
  };
  const data = {
    ...current.data,
    historico: [],
    sessao: null,
    compras: [compra],
    edicaoId: null,
  };
  await save(alice, current.revision, data);
  const actual = (await load(alice)).data;
  assert.equal(actual.sessao, null);
  assert.equal(actual.historico.length, 0);
  assert.equal(actual.compras[0].valorTotal, 21);
  assert.equal(actual.compras[0].itens[0].precoUnitario, 10.5);
  assert.equal((await load(bob)).data.historico.length, 1);
});
test('erro de validação reverte toda a gravação e nomes duplicados são bloqueados', async () => {
  const before = await load(alice);
  await assert.rejects(
    save(alice, before.revision, {
      ...blank(),
      historico: [list, { ...list, id: 'lista-2', nome: 'MERCADO' }],
    }),
  );
  assert.deepEqual(await load(alice), before);
  await assert.rejects(save(alice, before.revision, {}));
  assert.deepEqual(await load(alice), before);
});

const mac = (char) => char.repeat(64);
async function start(
  email = mac('a'),
  purpose = 'cadastro',
  fingerprint = mac('1'),
) {
  const id = randomUUID();
  const result = (
    await roleQuery(
      'service_role',
      null,
      'select public.lc_auth_start($1,$2,$3,$4,$5,$6) as result',
      [id, email, purpose, mac('b'), mac('c'), fingerprint],
    )
  ).rows[0].result;
  return { id, result, email, purpose };
}
async function activate(a) {
  return roleQuery(
    'service_role',
    null,
    'select public.lc_auth_activate($1,$2)',
    [a.id, mac('b')],
  );
}
async function verify(a, code = mac('c'), token = mac('b'), email = a.email) {
  return (
    await roleQuery(
      'service_role',
      null,
      'select public.lc_auth_verify($1,$2,$3,$4,$5,$6) as result',
      [a.id, email, a.purpose, token, code, mac('d')],
    )
  ).rows[0].result;
}
test('código sem expiração, vinculado à tentativa e e-mail, de uso único', async () => {
  const a = await start();
  assert.equal((await verify(a)).reason, 'invalid_attempt'); // Ainda enviando.
  await activate(a);
  await db.query(
    "update lc_private.verification_attempts set created_at=now()-interval '500 days' where id=$1",
    [a.id],
  );
  assert.equal((await verify(a, mac('c'), mac('e'))).reason, 'invalid_attempt');
  assert.equal(
    (await verify(a, mac('c'), mac('b'), mac('f'))).reason,
    'invalid_attempt',
  );
  assert.equal((await verify(a)).ok, true);
  assert.equal((await verify(a)).reason, 'invalid_attempt');
});
test('cinco erros bloqueiam; cancelar não devolve cota e novo número não repete o anterior', async () => {
  const a = await start(mac('2'));
  await activate(a);
  for (let n = 0; n < 4; n++)
    assert.equal((await verify(a, mac('0'))).remaining, 4 - n);
  assert.equal((await verify(a, mac('0'))).reason, 'locked');
  assert.equal((await verify(a)).reason, 'invalid_attempt');
  assert.equal(
    (await start(a.email, 'cadastro', mac('1'))).result.reason,
    'repeat',
  );
  const b = await start(a.email, 'cadastro', mac('2'));
  await roleQuery('service_role', null, 'select public.lc_auth_cancel($1,$2)', [
    b.id,
    mac('b'),
  ]);
  assert.equal((await start(a.email, 'recuperacao', mac('3'))).result.ok, true);
  const limited = await start(a.email, 'cadastro', mac('4'));
  assert.equal(limited.result.reason, 'rate_limit');
  assert.ok(limited.result.retryAfter > 2600);
  await db.query(
    "update lc_private.email_sends set sent_at=now()-interval '46 minutes' where email_key=$1",
    [a.email],
  );
  assert.equal((await start(a.email, 'cadastro', mac('4'))).result.ok, true);
});
test('substituição cancela anterior e limpeza de 45 min não expira código', async () => {
  const a = await start(mac('3'));
  await activate(a);
  const b = await start(a.email, 'cadastro', mac('2'));
  await activate(b);
  assert.equal((await verify(a)).reason, 'invalid_attempt');
  await db.exec(
    "update lc_private.email_sends set sent_at=now()-interval '46 minutes'; select lc_private.cleanup_send_history();",
  );
  assert.equal((await verify(b)).ok, true);
});
test('recuperação exige código e uma prova separada, consumida uma única vez', async () => {
  const a = await start(mac('4'), 'recuperacao');
  await activate(a);
  const consume = async (token) =>
    (
      await roleQuery(
        'service_role',
        null,
        'select public.lc_auth_consume_reset($1,$2,$3) as ok',
        [a.id, a.email, token],
      )
    ).rows[0].ok;
  assert.equal(await consume(mac('b')), false);
  assert.equal((await verify(a)).ok, true);
  assert.equal((await verify(a)).reason, 'invalid_attempt');
  assert.equal(await consume(mac('b')), false);
  assert.equal(await consume(mac('d')), true);
  assert.equal(await consume(mac('d')), false);
});
