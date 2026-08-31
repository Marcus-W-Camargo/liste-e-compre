import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createAuthController } from '../server/auth-controller.mjs';
import { createHandler } from '../server/auth-handler.mjs';

const secret = 'x'.repeat(43);
const email = 'alice@example.com';
const name = 'Alice Silva';

function createFixture({ purpose, synthetic }) {
  const attempts = new Map();
  const sent = [];
  const calls = [];
  let activations = 0;

  const providers = {
    assertReady: async () => {},
    recoveryExists: async () => !synthetic,
    send: async (data) => {
      sent.push(data);
    },
    signup: async () => {},
    reset: async () => {},
    rpc: async (fn, params) => {
      calls.push(fn);

      if (fn === 'lc_auth_email_exists') return synthetic;

      if (fn === 'lc_auth_start') {
        attempts.set(params.p_id, {
          ...params,
          stage: 'sending',
        });
        return { ok: true };
      }

      const attempt = attempts.get(params.p_id);

      if (fn === 'lc_auth_activate') {
        activations++;
        if (!attempt || activations === 1) return false;
        attempt.stage = 'code';
        return true;
      }

      if (fn === 'lc_auth_cancel') {
        if (attempt?.p_token_mac === params.p_token_mac)
          attempts.delete(params.p_id);
        return true;
      }

      throw new Error(`${purpose}:${fn}`);
    },
  };

  return {
    attempts,
    sent,
    calls,
    handle: createAuthController({
      secret,
      providers,
      generateCode: () => '0042',
    }),
  };
}

async function http(controller, body) {
  const req = Readable.from([JSON.stringify(body)]);
  req.method = 'POST';
  req.headers = {
    origin: 'http://127.0.0.1:5173',
    'content-type': 'application/json',
  };

  const res = {
    statusCode: 0,
    setHeader() {},
    end(payload) {
      res.body = JSON.parse(payload);
    },
  };

  await createHandler({
    env: { APP_ORIGIN: 'http://127.0.0.1:5173' },
    controller,
  })(req, res);

  return { statusCode: res.statusCode, body: res.body };
}

function publicStartShape(response) {
  return {
    statusCode: response.statusCode,
    keys: Object.keys(response.body).sort(),
    ok: response.body.ok,
    idType: typeof response.body.id,
    tokenType: typeof response.body.token,
    code: response.body.code,
    error: response.body.error,
  };
}

async function compareConcurrentStarts(purpose) {
  const real = createFixture({ purpose, synthetic: false });
  const synthetic = createFixture({ purpose, synthetic: true });
  const body = {
    action: 'start',
    purpose,
    email,
    name: purpose === 'cadastro' ? name : '',
  };

  const realResponses = await Promise.all([
    http(real.handle, body),
    http(real.handle, body),
  ]);
  const syntheticResponses = await Promise.all([
    http(synthetic.handle, body),
    http(synthetic.handle, body),
  ]);

  for (let index = 0; index < 2; index++) {
    assert.deepEqual(
      publicStartShape(realResponses[index]),
      publicStartShape(syntheticResponses[index]),
    );
    assert.deepEqual(publicStartShape(realResponses[index]), {
      statusCode: 200,
      keys: ['id', 'ok', 'token'],
      ok: true,
      idType: 'string',
      tokenType: 'string',
      code: undefined,
      error: undefined,
    });
  }

  assert.equal(real.sent.length, 2);
  assert.equal(real.calls.filter((call) => call === 'lc_auth_activate').length, 2);
  assert.equal(real.calls.filter((call) => call === 'lc_auth_cancel').length, 1);
  assert.equal(real.attempts.size, 1);
  assert.equal(
    realResponses.filter((response) => real.attempts.has(response.body.id)).length,
    1,
  );

  assert.equal(synthetic.sent.length, 0);
  assert.equal(synthetic.attempts.size, 0);
  assert.equal(
    synthetic.calls.filter((call) => call === 'lc_auth_activate').length,
    0,
  );
}

test('cadastro mantém dois start concorrentes indistinguíveis do caminho sintético', async () => {
  await compareConcurrentStarts('cadastro');
});

test('recuperação mantém dois start concorrentes indistinguíveis do caminho sintético', async () => {
  await compareConcurrentStarts('recuperacao');
});
