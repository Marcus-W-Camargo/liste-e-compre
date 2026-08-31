import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../server/auth-handler.mjs';

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

async function executar(origin, env = {}) {
  const handler = createHandler({
    env,
    controller: async () => ({ ok: true }),
  });
  const req = {
    method: 'POST',
    headers: {
      origin,
      'content-type': 'application/json',
    },
    body: { action: 'noop' },
  };
  const res = response();

  await handler(req, res);
  return res;
}

test('auth aceita explicitamente o domínio oficial de produção', async () => {
  const res = await executar('https://listeecompre.vercel.app', {});

  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { ok: true });
});

test('auth normaliza APP_ORIGIN válido e barra final', async () => {
  const res = await executar('https://app.exemplo.test/', {
    APP_ORIGIN: 'https://app.exemplo.test/',
  });

  assert.equal(res.statusCode, 200);
});

test('auth rejeita origem arbitrária mesmo com ambiente Preview', async () => {
  const res = await executar('https://evil.test', {
    VERCEL_ENV: 'preview',
    VERCEL_URL: 'preview-seguro.vercel.app',
    VERCEL_BRANCH_URL: 'branch-segura.vercel.app',
  });

  assert.equal(res.statusCode, 403);
  assert.equal(JSON.parse(res.body).code, 'ORIGEM_INVALIDA');
});

test('auth aceita somente URLs Vercel declaradas pela Preview', async () => {
  const env = {
    VERCEL_ENV: 'preview',
    VERCEL_URL: 'preview-seguro.vercel.app',
    VERCEL_BRANCH_URL: 'branch-segura.vercel.app',
  };

  for (const origin of [
    'https://preview-seguro.vercel.app',
    'https://branch-segura.vercel.app',
  ]) {
    const res = await executar(origin, env);
    assert.equal(res.statusCode, 200);
  }

  const naoDeclarada = await executar('https://outra-preview.vercel.app', env);
  assert.equal(naoDeclarada.statusCode, 403);
});
