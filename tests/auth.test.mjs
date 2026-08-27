import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthHandler } from '../server/auth-handler.mjs';
import { createVerification, LIMIT_SCRIPT } from '../server/verification.mjs';
import { createRedis } from '../server/redis.mjs';
import { createEmailSender, createAccounts } from '../server/providers.mjs';
import { AuthError } from '../server/errors.mjs';
import { nomeValido, senhaValida, normalizarEmail } from '../shared/auth-validation.mjs';
import { redisFixture } from './helpers/redis-lua.mjs';

const email = 'maria@example.test';
const nome = 'Maria Silva';
const senha = 'Senha1!';
const origin = 'https://example.test';

function fixture(options = {}) {
  const redis = redisFixture();
  const messages = [];
  const accounts = [];
  let accountFactoryCalls = 0;
  let cookie = '';
  const verification = createVerification({ command: redis.command,
    secret: Buffer.alloc(32, 17).toString('base64url'), namespace: 'tests',
    sendEmail: async (mail) => {
      if (options.sendFailure) throw new AuthError(503, 'Falha no envio');
      messages.push(mail);
    } });
  const handler = createAuthHandler({
    env: { VERCEL: '1', APP_ORIGIN: origin }, getVerification: () => verification,
    getAccounts: () => {
      accountFactoryCalls++;
      return {
        signup: async (...args) => {
          if (options.duplicate) throw new AuthError(409, 'E-mail já cadastrado');
          accounts.push(['signup', ...args]);
        },
        reset: async (...args) => accounts.push(['reset', ...args]),
      };
    },
  });
  async function request(body, headers = {}, method = 'POST') {
    const response = { headers: {}, statusCode: 0, body: '',
      setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
      end(value) { this.body = value; } };
    await handler({ method, body,
      headers: { origin, 'content-type': 'application/json', 'x-vercel-forwarded-for': '127.0.0.1', cookie, ...headers } }, response);
    if (response.headers['set-cookie']) cookie = response.headers['set-cookie'].split(';')[0];
    return response;
  }
  const start = (type = 'cadastro') => request({ action: 'start', type, email, nome });
  const confirm = (codigo = messages.at(-1).code) => request({ action: 'confirm-signup', email, nome, senha, codigo });
  return { redis, messages, accounts, request, start, confirm,
    factoryCalls: () => accountFactoryCalls, cookie: () => cookie };
}

test('nome: exatamente duas partes, um espaço e até 21 caracteres', () => {
  for (const value of ['Maria Silva', 'João Araújo', 'A B', 'abcdefghij klmnopqrst', 'Joa\u0303o Silva']) assert.equal(nomeValido(value), true, value);
  for (const value of ['', 'Maria', ' Maria Silva', 'Maria Silva ', 'Maria  Silva', 'Maria da Silva', 'Maria\tSilva', 'Maria\nSilva', 'Maria\u00a0Silva', 'Maria-Silva', 'Maria1 Silva', 'abcdefghijk klmnopqrst']) assert.equal(nomeValido(value), false, value);
});
test('senha mantém requisitos e rejeita truncamento bcrypt; e-mail normalizado', () => {
  assert.equal(senhaValida(senha), true);
  for (const value of ['123456', 'abcdef', 'abc1!', 'S'.repeat(73) + '1!', 'á'.repeat(36) + '1!', 'abc1!\0']) assert.equal(senhaValida(value), false);
  assert.equal(normalizarEmail(' MARIA@EXAMPLE.TEST '), email);
});
test('cadastro: nenhum Supabase antes da confirmação; cookie seguro e Redis sem dados em claro', async () => {
  const f = fixture();
  const response = await f.start();
  assert.equal(response.statusCode, 200);
  assert.equal(f.factoryCalls(), 0);
  assert.match(response.headers['set-cookie'], /^__Host-lc-verification=.+HttpOnly; SameSite=Strict; Max-Age=600; Secure$/);
  assert.deepEqual(JSON.parse(response.body), { ok: true });
  const record = [...f.redis.records].find(([key]) => key.includes(':challenge:'));
  assert.equal(record[1].fields.code.length, 64);
  assert.equal(record[1].fields.nonce.length, 64);
  const stored = JSON.stringify([...f.redis.records]);
  for (const value of [email, nome, senha]) assert.ok(!stored.includes(value));
  assert.equal((await f.confirm()).statusCode, 200);
  assert.deepEqual(f.accounts, [['signup', email, senha, nome]]);
  assert.equal((await f.confirm()).statusCode, 400);
  assert.equal(f.factoryCalls(), 1);
});
test('não aceita cadastro sem início, cookie ou código', async () => {
  const f = fixture();
  assert.equal((await f.confirm('1234')).statusCode, 400);
  assert.equal(f.factoryCalls(), 0);
});
test('código errado nunca acessa Supabase; limite não pode ser reiniciado no navegador', async () => {
  const f = fixture(); await f.start();
  const wrong = f.messages[0].code === '0000' ? '0001' : '0000';
  for (let i = 0; i < 5; i++) assert.equal((await f.confirm(wrong)).statusCode, 400);
  assert.equal((await f.confirm()).statusCode, 429);
  assert.equal(f.factoryCalls(), 0);
});
test('código expira após dez minutos', async () => {
  const f = fixture(); await f.start(); f.redis.advance(600001);
  assert.equal((await f.confirm()).statusCode, 400);
  assert.equal(f.factoryCalls(), 0);
});
test('requisições concorrentes consomem a prova uma única vez', async () => {
  const f = fixture(); await f.start();
  const results = await Promise.all(Array.from({ length: 8 }, () => f.confirm()));
  assert.equal(results.filter((r) => r.statusCode === 200).length, 1);
  assert.equal(f.accounts.length, 1);
});
test('reenvio tem espera e invalida o código e cookie anteriores', async () => {
  const f = fixture(); await f.start();
  const oldCookie = f.cookie(); const oldCode = f.messages[0].code;
  const blocked = await f.start(); assert.equal(blocked.statusCode, 429);
  f.redis.advance(61000); assert.equal((await f.start()).statusCode, 200);
  const result = await f.request({ action: 'confirm-signup', email, nome, senha, codigo: oldCode }, { cookie: oldCookie });
  assert.equal(result.statusCode, 400); assert.equal(f.factoryCalls(), 0);
});
test('código de outro e-mail ou outra finalidade não serve para cadastrar', async () => {
  const f = fixture(); await f.start('recuperacao');
  assert.equal((await f.confirm()).statusCode, 400);
  assert.equal((await f.request({ action: 'verify-recovery', email: 'outro@example.test', codigo: f.messages[0].code })).statusCode, 400);
  assert.equal(f.factoryCalls(), 0);
});
test('recuperação: só redefine com prova confirmada, rotacionada e de uso único', async () => {
  const f = fixture(); await f.start('recuperacao');
  const before = f.cookie();
  const reset = () => f.request({ action: 'reset-password', email, senha });
  assert.equal((await reset()).statusCode, 400); assert.equal(f.factoryCalls(), 0);
  assert.equal((await f.request({ action: 'verify-recovery', email, codigo: f.messages[0].code })).statusCode, 200);
  const verified = f.cookie(); assert.notEqual(before, verified); assert.equal(f.factoryCalls(), 0);
  assert.equal((await reset()).statusCode, 200);
  assert.deepEqual(f.accounts, [['reset', email, senha]]);
  assert.equal((await f.request({ action: 'reset-password', email, senha }, { cookie: verified })).statusCode, 400);
});
test('prova de recuperação também expira', async () => {
  const f = fixture(); await f.start('recuperacao');
  await f.request({ action: 'verify-recovery', email, codigo: f.messages[0].code });
  f.redis.advance(300001);
  assert.equal((await f.request({ action: 'reset-password', email, senha })).statusCode, 400);
  assert.equal(f.factoryCalls(), 0);
});
test('e-mail duplicado é tratado apenas após confirmação', async () => {
  const f = fixture({ duplicate: true }); await f.start();
  assert.equal(f.factoryCalls(), 0);
  assert.equal((await f.confirm()).statusCode, 409);
});
test('falha de entrega invalida desafio e não expõe o código', async () => {
  const f = fixture({ sendFailure: true });
  assert.equal((await f.start()).statusCode, 503);
  assert.equal([...f.redis.records.keys()].some((key) => key.includes(':challenge:')), false);
  assert.equal(f.factoryCalls(), 0);
});
test('limite continua bloqueado quando Redis TTL chega a zero', async () => {
  const redis = redisFixture();
  assert.equal(await redis.command('EVAL', LIMIT_SCRIPT, 1, 'limit', 1, 1), 0);
  redis.advance(999);
  assert.equal(await redis.command('EVAL', LIMIT_SCRIPT, 1, 'limit', 1, 1), 1);
});
test('falha no Redis bloqueia a operação, sem fallback local', async () => {
  const command = createRedis({ UPSTASH_REDIS_REST_URL: 'https://example.test', UPSTASH_REDIS_REST_TOKEN: 'test' }, async () => { throw new Error('offline'); });
  await assert.rejects(() => command('EVAL', 'script'), (e) => e.status === 503);
});
test('API rejeita origem cruzada, senha antecipada, método, payload e nome inválidos', async () => {
  const f = fixture(); const body = { action: 'start', type: 'cadastro', email, nome };
  assert.equal((await f.request(body, { origin: 'https://evil.test' })).statusCode, 403);
  assert.equal((await f.request(body, {}, 'GET')).statusCode, 405);
  assert.equal((await f.request(body, { 'content-type': 'text/plain' })).statusCode, 415);
  assert.equal((await f.request({ ...body, nome: 'Maria  Silva' })).statusCode, 400);
  assert.equal((await f.request({ ...body, senha })).statusCode, 400);
  assert.equal((await f.request('{')).statusCode, 400);
  assert.equal((await f.request({ ...body, nome: 'x'.repeat(9000) })).statusCode, 413);
  assert.equal(f.messages.length, 0); assert.equal(f.factoryCalls(), 0);
});
test('EmailJS mantém IDs, destinatário e variáveis dos templates existentes', async () => {
  const requests = [];
  const send = createEmailSender({ EMAILJS_PUBLIC_KEY: 'public-test', EMAILJS_PRIVATE_KEY: 'private-test',
    EMAILJS_SERVICE_ID: 'service-test', EMAILJS_TEMPLATE_CADASTRO_ID: 'signup-test', EMAILJS_TEMPLATE_RECUPERACAO_ID: 'reset-test' },
  async (url, init) => { requests.push([url, JSON.parse(init.body)]); return { ok: true }; });
  await send({ type: 'cadastro', email, name: nome, code: '0123' });
  await send({ type: 'recuperacao', email, name: 'Usuário', code: '4567' });
  assert.equal(requests[0][1].template_id, 'signup-test');
  assert.deepEqual(requests[0][1].template_params, { to_email: email, nome, codigo: '0123' });
  assert.equal(requests[1][1].template_id, 'reset-test');
  assert.equal(requests[1][1].template_params.recuperar, '4567');
});

test('limite diário de verificação sobrevive a novos códigos e janelas de dez minutos', async () => {
  const f = fixture();
  for (let i = 0; i < 11; i++) {
    f.redis.advance(3600001);
    assert.equal((await f.start()).statusCode, 200);
    const wrong = f.messages.at(-1).code === '0000' ? '0001' : '0000';
    assert.equal((await f.confirm(wrong)).statusCode, i < 10 ? 400 : 429);
  }
  assert.equal(f.factoryCalls(), 0);
});
test('cookie inventado ou de outro navegador não aceita nem o código certo', async () => {
  const f = fixture(); await f.start();
  const response = await f.request({ action: 'confirm-signup', email, nome, senha, codigo: f.messages[0].code },
    { cookie: '__Host-lc-verification=' + 'z'.repeat(43) });
  assert.equal(response.statusCode, 400); assert.equal(f.factoryCalls(), 0);
});
test('resposta inválida do limitador também bloqueia envios', async () => {
  let sent = false;
  const verification = createVerification({ command: async () => null,
    secret: Buffer.alloc(32, 17).toString('base64url'), namespace: 'tests', sendEmail: async () => { sent = true; } });
  await assert.rejects(() => verification.start('cadastro', email, nome, '127.0.0.1'), (e) => e.status === 503);
  assert.equal(sent, false);
});
test('provider Supabase exige cadastro público desativado e cria usuário confirmado', async () => {
  const calls = [];
  let disabled = false;
  const userId = '11111111-1111-4111-8111-111111111111';
  const accounts = createAccounts({ SUPABASE_URL: 'https://example.test', SUPABASE_SECRET_KEY: 'server-test', AUTH_ADMIN_SIGNUPS_ONLY: 'true' },
    async (url, init) => {
      const path = new URL(url).pathname;
      calls.push([path, init?.body ? JSON.parse(init.body) : null]);
      if (path.endsWith('/settings')) return Response.json({ disable_signup: disabled });
      if (path.endsWith('/lc_auth_user_id_by_email')) return Response.json(userId);
      if (path.includes('/admin/users')) return Response.json({ id: userId, email, email_confirmed_at: '2026-08-28T00:00:00Z' });
      throw new Error('Unexpected network request');
    });
  await assert.rejects(() => accounts.signup(email, senha, nome), (e) => e.status === 503);
  assert.equal(calls.length, 1);
  disabled = true;
  await accounts.signup(email, senha, nome);
  assert.deepEqual(calls.at(-1), ['/auth/v1/admin/users', {
    email, password: senha, email_confirm: true, user_metadata: { full_name: nome },
  }]);
  await accounts.reset(email, senha);
  assert.deepEqual(calls.at(-2), ['/rest/v1/rpc/lc_auth_user_id_by_email', { p_email: email }]);
  assert.deepEqual(calls.at(-1), [`/auth/v1/admin/users/${userId}`, { password: senha }]);
});
