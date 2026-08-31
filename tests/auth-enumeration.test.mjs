import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createAuthController } from '../server/auth-controller.mjs';
import { createHandler } from '../server/auth-handler.mjs';

const secret = 'x'.repeat(43);
const email = 'alice@example.com';
const password = 'Teste123!';
const name = 'Alice Silva';

function createFixture({
  signupExists = false,
  recoveryExists = true,
  startLimitAfter = Infinity,
} = {}) {
  const attempts = new Map();
  const sent = [];
  const calls = [];
  let starts = 0;

  const providers = {
    assertReady: async () => {},
    recoveryExists: async () => recoveryExists,
    send: async (data) => {
      sent.push(data);
    },
    signup: async () => {},
    reset: async () => {},
    rpc: async (fn, params) => {
      calls.push(fn);

      if (fn === 'lc_auth_email_exists') return signupExists;

      if (fn === 'lc_auth_start') {
        starts++;
        if (starts > startLimitAfter)
          return { ok: false, reason: 'rate_limit', retryAfter: 2700 };
        attempts.set(params.p_id, {
          ...params,
          stage: 'sending',
          errors: 0,
        });
        return { ok: true };
      }

      const attempt = attempts.get(params.p_id);

      if (fn === 'lc_auth_activate') {
        if (!attempt) return false;
        attempt.stage = 'code';
        return true;
      }

      if (fn === 'lc_auth_cancel') {
        if (attempt?.p_token_mac === params.p_token_mac)
          attempts.delete(params.p_id);
        return true;
      }

      if (
        !attempt ||
        attempt.p_token_mac !== params.p_token_mac ||
        attempt.p_email_key !== params.p_email_key
      )
        return { ok: false, reason: 'invalid_attempt' };

      if (fn === 'lc_auth_verify') {
        if (attempt.stage !== 'code' || attempt.p_purpose !== params.p_purpose)
          return { ok: false, reason: 'invalid_attempt' };

        if (attempt.p_code_mac !== params.p_code_mac) {
          attempt.errors++;
          if (attempt.errors >= 5) {
            attempts.delete(params.p_id);
            return { ok: false, reason: 'locked' };
          }
          return {
            ok: false,
            reason: 'wrong_code',
            remaining: 5 - attempt.errors,
          };
        }

        if (params.p_purpose === 'recuperacao') {
          attempt.stage = 'reset';
          attempt.p_token_mac = params.p_reset_mac;
        } else {
          attempts.delete(params.p_id);
        }

        return { ok: true };
      }

      if (fn === 'lc_auth_consume_reset') {
        if (attempt.stage !== 'reset') return false;
        attempts.delete(params.p_id);
        return true;
      }

      throw new Error(fn);
    },
  };

  return {
    attempts,
    calls,
    sent,
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

  const headers = {};
  const res = {
    statusCode: 0,
    setHeader(name, value) {
      headers[name] = value;
    },
    end(payload) {
      res.body = JSON.parse(payload);
    },
  };

  await createHandler({
    env: { APP_ORIGIN: 'http://127.0.0.1:5173' },
    controller,
  })(req, res);

  return { statusCode: res.statusCode, body: res.body, headers };
}

function publicShape(response) {
  return {
    statusCode: response.statusCode,
    keys: Object.keys(response.body).sort(),
    ok: response.body.ok,
    code: response.body.code,
    error: response.body.error,
  };
}

test('cadastro mantém segunda etapa neutra para tentativa real e sintética, inclusive após bloqueio', async () => {
  const real = createFixture({ signupExists: false });
  const synthetic = createFixture({ signupExists: true });

  const realStart = await http(real.handle, {
    action: 'start',
    purpose: 'cadastro',
    email,
    name,
  });
  const syntheticStart = await http(synthetic.handle, {
    action: 'start',
    purpose: 'cadastro',
    email,
    name,
  });

  assert.equal(real.sent.length, 1);
  assert.equal(real.attempts.size, 1);
  assert.equal(synthetic.sent.length, 0);
  assert.equal(synthetic.attempts.size, 0);

  const realVerify = {
    action: 'confirm-signup',
    id: realStart.body.id,
    token: realStart.body.token,
    email,
    name,
    password,
    code: '9999',
  };
  const syntheticVerify = {
    action: 'confirm-signup',
    id: syntheticStart.body.id,
    token: syntheticStart.body.token,
    email,
    name,
    password,
    code: '9999',
  };

  for (let attempt = 1; attempt <= 6; attempt++) {
    const realResponse = await http(real.handle, realVerify);
    const syntheticResponse = await http(synthetic.handle, syntheticVerify);

    assert.deepEqual(publicShape(realResponse), publicShape(syntheticResponse));
    assert.deepEqual(publicShape(realResponse), {
      statusCode: 400,
      keys: ['code', 'error', 'ok'],
      ok: false,
      code: 'VERIFICACAO_INVALIDA',
      error:
        'Não foi possível confirmar o código. Confira os dados ou inicie uma nova tentativa.',
    });
    assert.equal('remaining' in realResponse.body, false);
    assert.equal('remaining' in syntheticResponse.body, false);
  }

  assert.equal(real.attempts.size, 0);
  assert.equal(synthetic.attempts.size, 0);
});

test('recuperação mantém segunda etapa neutra para tentativa real e sintética, inclusive após bloqueio', async () => {
  const real = createFixture({ recoveryExists: true });
  const synthetic = createFixture({ recoveryExists: false });

  const realStart = await http(real.handle, {
    action: 'start',
    purpose: 'recuperacao',
    email,
    name: '',
  });
  const syntheticStart = await http(synthetic.handle, {
    action: 'start',
    purpose: 'recuperacao',
    email,
    name: '',
  });

  assert.equal(real.sent.length, 1);
  assert.equal(real.attempts.size, 1);
  assert.equal(synthetic.sent.length, 0);
  assert.equal(synthetic.attempts.size, 0);

  const realVerify = {
    action: 'verify-recovery',
    id: realStart.body.id,
    token: realStart.body.token,
    email,
    code: '9999',
  };
  const syntheticVerify = {
    action: 'verify-recovery',
    id: syntheticStart.body.id,
    token: syntheticStart.body.token,
    email,
    code: '9999',
  };

  for (let attempt = 1; attempt <= 6; attempt++) {
    const realResponse = await http(real.handle, realVerify);
    const syntheticResponse = await http(synthetic.handle, syntheticVerify);

    assert.deepEqual(publicShape(realResponse), publicShape(syntheticResponse));
    assert.equal(realResponse.body.code, 'VERIFICACAO_INVALIDA');
    assert.deepEqual(Object.keys(realResponse.body).sort(), [
      'code',
      'error',
      'ok',
    ]);
    assert.equal('remaining' in realResponse.body, false);
    assert.equal('remaining' in syntheticResponse.body, false);
  }

  assert.equal(real.attempts.size, 0);
  assert.equal(synthetic.attempts.size, 0);
});

function publicStartShape(response) {
  return {
    statusCode: response.statusCode,
    keys: Object.keys(response.body).sort(),
    ok: response.body.ok,
    idType: typeof response.body.id,
    tokenType: typeof response.body.token,
  };
}

async function compareRepeatedStarts({ purpose, real, synthetic }) {
  let limitedResponse;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const body = {
      action: 'start',
      purpose,
      email,
      name: purpose === 'cadastro' ? name : '',
    };
    const realResponse = await http(real.handle, body);
    const syntheticResponse = await http(synthetic.handle, body);

    assert.deepEqual(
      publicStartShape(realResponse),
      publicStartShape(syntheticResponse),
    );
    assert.deepEqual(publicStartShape(realResponse), {
      statusCode: 200,
      keys: ['id', 'ok', 'token'],
      ok: true,
      idType: 'string',
      tokenType: 'string',
    });
    assert.equal('code' in realResponse.body, false);
    assert.equal('error' in realResponse.body, false);

    if (attempt === 4) limitedResponse = realResponse;
  }

  assert.equal(real.sent.length, 3);
  assert.equal(synthetic.sent.length, 0);
  assert.equal(real.attempts.has(limitedResponse.body.id), false);
  assert.equal(synthetic.attempts.size, 0);
}

test('cadastro mantém start neutro quando a cota específica de e-mail é excedida', async () => {
  await compareRepeatedStarts({
    purpose: 'cadastro',
    real: createFixture({ signupExists: false, startLimitAfter: 3 }),
    synthetic: createFixture({ signupExists: true, startLimitAfter: 3 }),
  });
});

test('recuperação mantém start neutro quando a cota específica de e-mail é excedida', async () => {
  await compareRepeatedStarts({
    purpose: 'recuperacao',
    real: createFixture({ recoveryExists: true, startLimitAfter: 3 }),
    synthetic: createFixture({ recoveryExists: false, startLimitAfter: 3 }),
  });
});

