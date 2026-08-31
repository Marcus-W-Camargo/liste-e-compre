import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../server/auth-handler.mjs';
import { createFeedbackHandler } from '../server/feedback-handler.mjs';
import { createDeleteAccountHandler } from '../server/delete-account-handler.mjs';

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(value) {
      this.body = value;
    },
  };
}

test('auth aplica proteção por origem antes de iniciar verificação', async () => {
  let chamadas = 0;
  const handler = createHandler({
    env: { APP_ORIGIN: 'https://app.test' },
    controller: async () => ({ ok: true }),
    rateLimit: async () => {
      chamadas++;
    },
  });
  const req = {
    method: 'POST',
    headers: {
      origin: 'https://app.test',
      'content-type': 'application/json',
    },
    body: {
      action: 'start',
      purpose: 'cadastro',
      email: 'a@b.com',
      name: 'Nome Sobrenome',
    },
  };
  const res = response();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(chamadas, 1);
});

test('auth bloqueia origem inválida sem consumir rate limit', async () => {
  let chamadas = 0;
  const handler = createHandler({
    env: { APP_ORIGIN: 'https://app.test' },
    controller: async () => ({ ok: true }),
    rateLimit: async () => {
      chamadas++;
    },
  });
  const req = {
    method: 'POST',
    headers: {
      origin: 'https://evil.test',
      'content-type': 'application/json',
    },
    body: { action: 'start' },
  };
  const res = response();

  await handler(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(chamadas, 0);
});

test('feedback rejeita navegador fora de relato de bug', async () => {
  const handler = createFeedbackHandler({
    env: { RESEND_API_KEY: 'x', APP_ORIGIN: 'https://app.test' },
    rateLimit: async () => {},
    fetchImpl: async () => ({ ok: true, json: async () => ({ id: '1' }) }),
  });
  const req = {
    method: 'POST',
    headers: {
      origin: 'https://app.test',
      'content-type': 'application/json',
    },
    body: {
      tipo: 'Elogio',
      mensagem: 'Ótimo',
      email: '',
      navegador: 'browser',
      website: '',
    },
  };
  const res = response();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
});

test('feedback aceita diagnóstico apenas em bug', async () => {
  const handler = createFeedbackHandler({
    env: { RESEND_API_KEY: 'x', APP_ORIGIN: 'https://app.test' },
    rateLimit: async () => {},
    fetchImpl: async () => ({ ok: true, json: async () => ({ id: '1' }) }),
  });
  const req = {
    method: 'POST',
    headers: {
      origin: 'https://app.test',
      'content-type': 'application/json',
    },
    body: {
      tipo: 'Bug',
      mensagem: 'Falhou',
      email: '',
      navegador: 'browser',
      website: '',
    },
  };
  const res = response();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
});

test('feedback valida tamanho mesmo com body previamente processado', async () => {
  const handler = createFeedbackHandler({
    env: { RESEND_API_KEY: 'x', APP_ORIGIN: 'https://app.test' },
    rateLimit: async () => {},
    fetchImpl: async () => {
      throw new Error('não deve enviar');
    },
  });
  const req = {
    method: 'POST',
    headers: {
      origin: 'https://app.test',
      'content-type': 'application/json',
    },
    body: {
      tipo: 'Bug',
      mensagem: 'x'.repeat(13000),
      email: '',
      navegador: '',
      website: '',
    },
  };
  const res = response();

  await handler(req, res);

  assert.equal(res.statusCode, 413);
});

test('exclusão exige autenticação', async () => {
  const handler = createDeleteAccountHandler({
    env: {
      APP_ORIGIN: 'https://app.test',
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SECRET_KEY: 'secret',
    },
    createClientImpl: () => {
      throw new Error('não deve criar cliente');
    },
  });
  const req = {
    method: 'DELETE',
    headers: { origin: 'https://app.test' },
  };
  const res = response();

  await handler(req, res);

  assert.equal(res.statusCode, 401);
});

test('exclusão remove foto antes do usuário autenticado', async () => {
  const ordem = [];
  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      admin: {
        deleteUser: async () => {
          ordem.push('usuario');
          return { error: null };
        },
      },
    },
    storage: {
      from: () => ({
        remove: async (paths) => {
          assert.deepEqual(paths, ['u1/avatar.jpg']);
          ordem.push('foto');
          return { error: null };
        },
      }),
    },
  };
  const handler = createDeleteAccountHandler({
    env: {
      APP_ORIGIN: 'https://app.test',
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SECRET_KEY: 'secret',
    },
    createClientImpl: () => client,
  });
  const req = {
    method: 'DELETE',
    headers: {
      origin: 'https://app.test',
      authorization: 'Bearer token',
    },
  };
  const res = response();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(ordem, ['foto', 'usuario']);
});
