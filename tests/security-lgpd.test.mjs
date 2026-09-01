import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../server/auth-handler.mjs';
import { createFeedbackHandler } from '../server/feedback-handler.mjs';
import { createDeleteAccountHandler } from '../server/delete-account-handler.mjs';
import { AppError } from '../server/errors.mjs';

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

test('feedback envia reclamação válida com e sem e-mail quando rate limit permite', async () => {
  for (const email of ['', 'cliente@example.com']) {
    const enviados = [];
    const handler = createFeedbackHandler({
      env: { RESEND_API_KEY: 'x', APP_ORIGIN: 'https://app.test' },
      rateLimit: async () => {},
      fetchImpl: async (url, options) => {
        enviados.push({ url, options });
        return { ok: true, json: async () => ({ id: 'feedback-1' }) };
      },
    });
    const req = {
      method: 'POST',
      headers: {
        origin: 'https://app.test',
        'content-type': 'application/json',
      },
      body: {
        tipo: 'Reclamação',
        mensagem: 'Mensagem válida para atendimento.',
        email,
        navegador: '',
        website: '',
      },
    };
    const res = response();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(enviados.length, 1);
    assert.equal(enviados[0].url, 'https://api.resend.com/emails');
    const payload = JSON.parse(enviados[0].options.body);
    assert.equal(payload.subject, '[Liste & Compre] Reclamação');
    assert.match(payload.text, /Mensagem válida para atendimento\./);
    if (email) assert.match(payload.text, /cliente@example\.com/);
    else assert.doesNotMatch(payload.text, /E-mail do usuário:/);
  }
});

test('feedback preserva indisponibilidade do rate limiter sem virar dados inválidos', async () => {
  let enviou = false;
  const handler = createFeedbackHandler({
    env: { RESEND_API_KEY: 'x', APP_ORIGIN: 'https://app.test' },
    rateLimit: async () => {
      throw new AppError(
        503,
        'RATE_LIMIT_INDISPONIVEL',
        'detalhe interno que não deve sair',
      );
    },
    fetchImpl: async () => {
      enviou = true;
      return { ok: true, json: async () => ({ id: '1' }) };
    },
  });
  const req = {
    method: 'POST',
    headers: {
      origin: 'https://app.test',
      'content-type': 'application/json',
    },
    body: {
      tipo: 'Reclamação',
      mensagem: 'Mensagem válida.',
      email: '',
      navegador: '',
      website: '',
    },
  };
  const res = response();

  await handler(req, res);

  assert.equal(res.statusCode, 503);
  assert.equal(enviou, false);
  assert.deepEqual(JSON.parse(res.body), {
    ok: false,
    error: 'Serviço temporariamente indisponível.',
  });
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

test('solicitação de exclusão exige autenticação', async () => {
  const client = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('inválida') }),
    },
  };
  const handler = createDeleteAccountHandler({
    env: {
      APP_ORIGIN: 'https://app.test',
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SECRET_KEY: 'secret',
      AUTH_VERIFICATION_SECRET: 'verification-secret',
      RESEND_API_KEY: 'resend',
    },
    createClientImpl: () => client,
    rateLimit: async () => {},
  });
  const req = {
    method: 'POST',
    headers: {
      origin: 'https://app.test',
      'content-type': 'application/json',
    },
    body: {
      action: 'request',
      deviceId: 'a'.repeat(48),
    },
  };
  const res = response();

  await handler(req, res);

  assert.equal(res.statusCode, 401);
});

test('exclusão só conclui após link no mesmo dispositivo, IP e conta', async () => {
  const ordem = [];
  const enviados = [];
  const user = { id: 'u1', email: 'cliente@example.com' };
  const client = {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
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
  const env = {
    APP_ORIGIN: 'https://app.test/',
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SECRET_KEY: 'secret',
    AUTH_VERIFICATION_SECRET: 'verification-secret',
    RESEND_API_KEY: 'resend',
  };
  const handler = createDeleteAccountHandler({
    env,
    createClientImpl: () => client,
    rateLimit: async () => {},
    fetchImpl: async (url, options) => {
      enviados.push({ url, options });
      return { ok: true, json: async () => ({ id: 'email-1' }) };
    },
  });
  const deviceId = 'd'.repeat(48);
  const headers = {
    origin: 'https://app.test',
    'content-type': 'application/json',
    authorization: 'Bearer token',
    'x-forwarded-for': '203.0.113.10',
  };

  const pedido = response();
  await handler(
    {
      method: 'POST',
      headers,
      body: { action: 'request', deviceId },
    },
    pedido,
  );

  assert.equal(pedido.statusCode, 200);
  assert.equal(enviados.length, 1);
  const email = JSON.parse(enviados[0].options.body);
  assert.deepEqual(email.to, ['cliente@example.com']);
  const match = email.text.match(/https:\/\/app\.test\/confirmar-exclusao\?token=([^\s]+)/);
  assert.ok(match);
  const token = decodeURIComponent(match[1]);

  const tentativaErrada = response();
  await handler(
    {
      method: 'POST',
      headers: { ...headers, 'x-forwarded-for': '203.0.113.11' },
      body: { action: 'confirm', deviceId, token },
    },
    tentativaErrada,
  );
  assert.equal(tentativaErrada.statusCode, 403);
  assert.deepEqual(ordem, []);

  const confirmacao = response();
  await handler(
    {
      method: 'POST',
      headers,
      body: { action: 'confirm', deviceId, token },
    },
    confirmacao,
  );

  assert.equal(confirmacao.statusCode, 200);
  assert.deepEqual(ordem, ['foto', 'usuario']);
});
