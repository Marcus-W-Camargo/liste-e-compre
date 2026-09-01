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

const emailJsEnv = {
  APP_ORIGIN: 'https://app.test',
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SECRET_KEY: 'secret',
  AUTH_VERIFICATION_SECRET: 'verification-secret',
  EMAILJS_PUBLIC_KEY: 'public',
  EMAILJS_PRIVATE_KEY: 'private',
  EMAILJS_SERVICE_ID: 'service',
  EMAILJS_TEMPLATE_CADASTRO_ID: 'template-cadastro',
  EMAILJS_TEMPLATE_RECUPERACAO_ID: 'template-conta',
};

test('solicitação de exclusão exige autenticação', async () => {
  const client = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('inválida') }),
    },
  };
  const handler = createDeleteAccountHandler({
    env: emailJsEnv,
    createClientImpl: () => client,
    rateLimit: async () => {},
  });
  const res = response();

  await handler(
    {
      method: 'POST',
      headers: {
        origin: 'https://app.test',
        'content-type': 'application/json',
      },
      body: { action: 'request', sessionId: 'a'.repeat(64) },
    },
    res,
  );

  assert.equal(res.statusCode, 401);
});

test('exclusão usa finalidade própria, código EmailJS e só apaga após código correto', async () => {
  const ordem = [];
  const envios = [];
  let tokenMac;
  let codeMac;
  const user = {
    id: 'u1',
    email: 'cliente@example.com',
    user_metadata: { full_name: 'Cliente Teste' },
  };
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
  const providers = {
    async rpc(name, params) {
      if (name === 'lc_auth_start') {
        assert.equal(params.p_purpose, 'exclusao');
        tokenMac = params.p_token_mac;
        codeMac = params.p_code_mac;
        return { ok: true };
      }
      if (name === 'lc_auth_activate') return params.p_token_mac === tokenMac;
      if (name === 'lc_auth_cancel') return true;
      if (name === 'lc_auth_verify') {
        if (params.p_token_mac !== tokenMac)
          return { ok: false, reason: 'invalid_attempt' };
        if (params.p_code_mac !== codeMac)
          return { ok: false, reason: 'wrong_code', remaining: 4 };
        return { ok: true };
      }
      throw new Error(`RPC inesperada: ${name}`);
    },
    async send(payload) {
      envios.push(payload);
    },
  };
  const handler = createDeleteAccountHandler({
    env: emailJsEnv,
    createClientImpl: () => client,
    rateLimit: async () => {},
    providersFactory: () => providers,
    generateCode: () => '1234',
  });
  const headers = {
    origin: 'https://app.test',
    'content-type': 'application/json',
    authorization: 'Bearer token',
  };
  const sessionId = 'd'.repeat(64);

  const pedido = response();
  await handler(
    { method: 'POST', headers, body: { action: 'request', sessionId } },
    pedido,
  );
  assert.equal(pedido.statusCode, 200);
  const tentativa = JSON.parse(pedido.body);
  assert.match(tentativa.id, /^[a-f0-9-]{36}$/);
  assert.match(tentativa.token, /^[a-f0-9]{64}$/);
  assert.equal(envios.length, 1);
  assert.deepEqual(envios[0], {
    purpose: 'exclusao',
    email: 'cliente@example.com',
    name: 'Cliente Teste',
    code: '1234',
  });
  assert.deepEqual(ordem, []);

  const incorreto = response();
  await handler(
    {
      method: 'POST',
      headers,
      body: {
        action: 'confirm',
        id: tentativa.id,
        token: tentativa.token,
        sessionId,
        code: '0000',
      },
    },
    incorreto,
  );
  assert.equal(incorreto.statusCode, 400);
  assert.match(JSON.parse(incorreto.body).error, /Código incorreto/);
  assert.deepEqual(ordem, []);

  const confirmacao = response();
  await handler(
    {
      method: 'POST',
      headers,
      body: {
        action: 'confirm',
        id: tentativa.id,
        token: tentativa.token,
        sessionId,
        code: '1234',
      },
    },
    confirmacao,
  );
  assert.equal(confirmacao.statusCode, 200);
  assert.deepEqual(ordem, ['foto', 'usuario']);
});

test('sessão de tentativa diferente não reutiliza a autorização de exclusão', async () => {
  let tokenMac;
  const user = { id: 'u1', email: 'cliente@example.com', user_metadata: {} };
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    storage: { from: () => ({ remove: async () => ({ error: null }) }) },
  };
  const providers = {
    async rpc(name, params) {
      if (name === 'lc_auth_start') {
        tokenMac = params.p_token_mac;
        return { ok: true };
      }
      if (name === 'lc_auth_activate') return true;
      if (name === 'lc_auth_verify')
        return params.p_token_mac === tokenMac
          ? { ok: true }
          : { ok: false, reason: 'invalid_attempt' };
      return true;
    },
    async send() {},
  };
  const handler = createDeleteAccountHandler({
    env: emailJsEnv,
    createClientImpl: () => client,
    rateLimit: async () => {},
    providersFactory: () => providers,
    generateCode: () => '1234',
  });
  const headers = {
    origin: 'https://app.test',
    'content-type': 'application/json',
    authorization: 'Bearer token',
  };
  const pedido = response();
  await handler(
    {
      method: 'POST',
      headers,
      body: { action: 'request', sessionId: 'a'.repeat(64) },
    },
    pedido,
  );
  const tentativa = JSON.parse(pedido.body);

  const confirmacao = response();
  await handler(
    {
      method: 'POST',
      headers,
      body: {
        action: 'confirm',
        id: tentativa.id,
        token: tentativa.token,
        sessionId: 'b'.repeat(64),
        code: '1234',
      },
    },
    confirmacao,
  );
  assert.equal(confirmacao.statusCode, 400);
});
