import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { Readable } from 'node:stream';
import { createAuthController } from '../server/auth-controller.mjs';
import { createHandler } from '../server/auth-handler.mjs';
import { AppError } from '../server/errors.mjs';
import { configProblems } from '../server/config.mjs';
import { classifyEmailError } from '../server/providers.mjs';
import {
  nomeValido,
  senhaValida,
  normalizarEmail,
} from '../shared/auth-validation.mjs';
const secret = 'x'.repeat(43),
  email = 'alice@example.com',
  password = 'Teste123!',
  name = 'Alice Silva';
function fixture(overrides = {}) {
  const calls = [],
    sent = [],
    attempts = new Map();
  const providers = {
    assertReady: async () => {
      calls.push('ready');
    },
    send: async (data) => {
      calls.push('send');
      sent.push(data);
    },
    signup: async (...args) => {
      calls.push(['signup', ...args]);
    },
    reset: async (...args) => {
      calls.push(['reset', ...args]);
    },
    rpc: async (fn, p) => {
      calls.push(fn);
      if (fn === 'lc_auth_start') {
        attempts.set(p.p_id, { ...p, stage: 'sending', errors: 0 });
        return { ok: true };
      }
      const a = attempts.get(p.p_id);
      if (fn === 'lc_auth_activate') {
        a.stage = 'code';
        return true;
      }
      if (fn === 'lc_auth_cancel') {
        if (a?.p_token_mac === p.p_token_mac) attempts.delete(p.p_id);
        return true;
      }
      if (
        !a ||
        a.p_token_mac !== p.p_token_mac ||
        a.p_email_key !== p.p_email_key
      )
        return { ok: false, reason: 'invalid_attempt' };
      if (fn === 'lc_auth_verify') {
        if (a.stage !== 'code' || a.p_purpose !== p.p_purpose)
          return { ok: false, reason: 'invalid_attempt' };
        if (a.p_code_mac !== p.p_code_mac) {
          a.errors++;
          if (a.errors >= 5) {
            attempts.delete(p.p_id);
            return { ok: false, reason: 'locked' };
          }
          return { ok: false, reason: 'wrong_code', remaining: 5 - a.errors };
        }
        if (p.p_purpose === 'recuperacao') {
          a.stage = 'reset';
          a.p_token_mac = p.p_reset_mac;
        } else attempts.delete(p.p_id);
        return { ok: true };
      }
      if (fn === 'lc_auth_consume_reset') {
        if (a.stage !== 'reset') return false;
        attempts.delete(p.p_id);
        return true;
      }
      throw new Error(fn);
    },
    ...overrides,
  };
  return {
    calls,
    sent,
    attempts,
    handle: createAuthController({
      secret,
      providers,
      generateCode: () => '0042',
    }),
  };
}
const startBody = { action: 'start', purpose: 'cadastro', email, name };
test('nome único input: exatamente duas partes e até 21 caracteres; senha mantém requisitos', () => {
  for (const n of ['Maria Silva', 'João José', 'ABCDEFGHIJ ABCDEFGHIJ'])
    assert.equal(nomeValido(n), true, n);
  for (const n of [
    'Maria',
    ' Maria Silva',
    'Maria  Silva',
    'Maria Silva ',
    'Maria de Silva',
    'Maria\tSilva',
    '123 Silva',
    'ABCDEFGHIJK ABCDEFGHIJ',
  ])
    assert.equal(nomeValido(n), false, n);
  assert.equal(senhaValida(password), true);
  assert.equal(senhaValida('123456!'), false);
  assert.equal(normalizarEmail(' ALICE@EXAMPLE.COM '), email);
});
test('start não recebe senha, não devolve código e não cria usuário', async () => {
  const f = fixture();
  await assert.rejects(
    f.handle({ ...startBody, password }),
    (e) => e.status === 400,
  );
  const result = await f.handle(startBody);
  assert.deepEqual(Object.keys(result).sort(), ['id', 'ok', 'token']);
  assert.equal(f.sent[0].code, '0042');
  assert.ok(!f.calls.some((c) => Array.isArray(c) && c[0] === 'signup'));
  const a = f.attempts.get(result.id);
  assert.ok(!JSON.stringify(a).includes(email));
  assert.ok(!JSON.stringify(a).includes(name));
});
test('não cria conta com código errado, e-mail trocado, token falso ou confirmação forjada', async () => {
  const f = fixture(),
    a = await f.handle(startBody);
  const body = {
    action: 'confirm-signup',
    ...a,
    email,
    password,
    name,
    code: '0042',
  };
  for (const patch of [
    { code: '9999' },
    { email: 'other@example.com' },
    { token: 'a'.repeat(64) },
    { code: '', verified: true },
  ])
    await assert.rejects(f.handle({ ...body, ...patch }));
  assert.ok(!f.calls.some((c) => Array.isArray(c)));
  await f.handle(body);
  assert.equal(
    f.calls.filter((c) => Array.isArray(c) && c[0] === 'signup').length,
    1,
  );
  await assert.rejects(f.handle(body));
});
test('cancelamento remove só a tentativa; ela não confirma depois', async () => {
  const f = fixture(),
    a = await f.handle(startBody);
  await f.handle({ action: 'cancel', ...a });
  await assert.rejects(
    f.handle({
      action: 'confirm-signup',
      ...a,
      email,
      name,
      password,
      code: '0042',
    }),
  );
});
test('recuperação não aceita pular a confirmação e troca o token após verificar', async () => {
  const f = fixture(),
    a = await f.handle({ ...startBody, purpose: 'recuperacao' });
  await assert.rejects(
    f.handle({ action: 'reset-password', ...a, email, password }),
  );
  const proof = await f.handle({
    action: 'verify-recovery',
    ...a,
    email,
    code: '0042',
  });
  assert.notEqual(proof.token, a.token);
  await assert.rejects(
    f.handle({ action: 'reset-password', ...a, email, password }),
  );
  await f.handle({ action: 'reset-password', ...proof, email, password });
  assert.equal(
    f.calls.filter((c) => Array.isArray(c) && c[0] === 'reset').length,
    1,
  );
});
test('configuração é verificada antes de reservar envio ou conferir código', async () => {
  const f = fixture({
    assertReady: async () => {
      throw new AppError(503, 'CONFIG', 'Configuração ausente');
    },
  });
  await assert.rejects(f.handle(startBody));
  assert.equal(f.calls.length, 0);
});
test('falha do EmailJS cancela a tentativa, sem criar conta', async () => {
  const f = fixture({
    send: async () => {
      throw new AppError(503, 'ENVIO', 'Falha no envio');
    },
  });
  await assert.rejects(f.handle(startBody));
  assert.equal(f.attempts.size, 0);
  assert.ok(f.calls.includes('lc_auth_cancel'));
});
test('limite de envio devolve Retry-After e não chama EmailJS', async () => {
  const f = fixture({
    rpc: async () => ({ ok: false, reason: 'rate_limit', retryAfter: 2700 }),
  });
  await assert.rejects(
    f.handle(startBody),
    (e) => e.status === 429 && e.retryAfter === 2700,
  );
  assert.equal(f.sent.length, 0);
});
test('HMAC distingue e-mail, propósito e tentativa; não é hash simples de quatro dígitos', () => {
  const mac = (...a) =>
    createHmac('sha256', secret).update(JSON.stringify(a)).digest('hex');
  assert.notEqual(
    mac('code', 'id1', email, 'cadastro', '0042'),
    mac('code', 'id2', email, 'cadastro', '0042'),
  );
});
async function http({
  method = 'POST',
  origin = 'http://127.0.0.1:5173',
  type = 'application/json',
  body = '{}',
  controller = async () => ({ ok: true }),
  extraEnv = {},
} = {}) {
  const req = Readable.from([body]);
  req.method = method;
  req.headers = { 'content-type': type, ...(origin ? { origin } : {}) };
  const headers = {};
  const res = {
    setHeader: (k, v) => {
      headers[k] = v;
    },
    end: (body) => {
      res.body = JSON.parse(body);
    },
    statusCode: 0,
  };
  await createHandler({
    env: { APP_ORIGIN: 'http://127.0.0.1:5173', ...extraEnv },
    controller,
  })(req, res);
  return { ...res, headers };
}
test('HTTP bloqueia GET, origem falsa, conteúdo não JSON e payload excessivo', async () => {
  assert.equal((await http({ method: 'GET' })).statusCode, 405);
  assert.equal(
    (await http({ origin: 'https://evil.example' })).statusCode,
    403,
  );
  assert.equal((await http({ origin: '' })).statusCode, 403);
  assert.equal((await http({ type: 'text/plain' })).statusCode, 415);
  assert.equal((await http({ body: 'x'.repeat(8193) })).statusCode, 413);
  assert.equal((await http({ body: '{invalid' })).statusCode, 400);
});
test('preview aceita somente URL exata do deployment, nunca domínio curinga', async () => {
  const extraEnv = { VERCEL_ENV: 'preview', VERCEL_URL: 'preview.vercel.app' };
  assert.equal(
    (await http({ origin: 'https://preview.vercel.app', extraEnv })).statusCode,
    200,
  );
  assert.equal(
    (await http({ origin: 'https://other.vercel.app', extraEnv })).statusCode,
    403,
  );
});
test('HTTP não expõe segredos em erros e devolve cabeçalhos seguros', async () => {
  const original = console.warn;
  console.warn = () => {};
  try {
    const r = await http({
      controller: async () => {
        throw new Error('password=segredo');
      },
    });
    assert.equal(r.statusCode, 503);
    assert.ok(!JSON.stringify(r.body).includes('segredo'));
    assert.equal(r.headers['Cache-Control'], 'no-store');
    const limited = await http({
      controller: async () => {
        throw new AppError(429, 'LIMITE', 'Aguarde', 45);
      },
    });
    assert.equal(limited.headers['Retry-After'], '45');
  } finally {
    console.warn = original;
  }
});
test('diagnóstico encontra placeholders e nunca imprime valores', () => {
  const problems = configProblems({
    EMAILJS_PRIVATE_KEY: 'sua_chave_privadaEXAMPLE',
    SUPABASE_SECRET_KEY: 'sb_publishable_demo',
  });
  assert.ok(problems.includes('EMAILJS_PRIVATE_KEY'));
  assert.ok(problems.includes('SUPABASE_SECRET_KEY'));
  assert.ok(!JSON.stringify(problems).includes('EXAMPLE'));
  assert.equal(classifyEmailError(404, 'Account not found'), 'CONTA_EMAILJS');
  assert.equal(
    classifyEmailError(400, 'Template not found'),
    'TEMPLATE_EMAILJS',
  );
});
