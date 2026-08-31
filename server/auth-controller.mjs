import { createHmac, randomBytes, randomInt, randomUUID } from 'node:crypto';
import {
  emailValido,
  nomeValido,
  normalizarEmail,
  senhaValida,
} from '../shared/auth-validation.mjs';
import { AppError } from './errors.mjs';

export function createAuthController({
  secret,
  providers,
  generateCode = () => String(randomInt(10000)).padStart(4, '0'),
}) {
  const mac = (...parts) =>
    createHmac('sha256', secret).update(JSON.stringify(parts)).digest('hex');
  const bad = () =>
    new AppError(400, 'DADOS_INVALIDOS', 'Confira os dados enviados.');

  function attempt(body) {
    if (
      !/^[a-f0-9-]{36}$/.test(body.id ?? '') ||
      !/^[a-f0-9]{64}$/.test(body.token ?? '')
    )
      throw bad();
    return { p_id: body.id, p_token_mac: mac('token', body.token) };
  }

  function emailOf(body) {
    const email = normalizarEmail(body.email);
    if (!emailValido(email))
      throw new AppError(400, 'EMAIL_INVALIDO', 'Informe um e-mail válido.');
    return email;
  }

  function checkResult(result) {
    if (result?.ok === true) return;
    if (result.reason === 'locked')
      throw new AppError(
        400,
        'TENTATIVA_BLOQUEADA',
        'Cinco códigos incorretos. Inicie uma nova tentativa.',
      );
    if (result.reason === 'wrong_code')
      throw new AppError(
        400,
        'CODIGO_INCORRETO',
        `Código incorreto. Restam ${result.remaining} tentativa(s).`,
      );
    throw new AppError(
      400,
      'TENTATIVA_INVALIDA',
      'Esta tentativa não está mais disponível. Inicie novamente.',
    );
  }

  return async function handle(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw bad();
    if (body.action === 'cancel') {
      await providers.rpc('lc_auth_cancel', attempt(body));
      return { ok: true };
    }

    const email = emailOf(body);
    const emailKey = mac('email', email);

    if (body.action === 'start') {
      if (
        !['cadastro', 'recuperacao'].includes(body.purpose) ||
        'password' in body ||
        'senha' in body
      )
        throw bad();

      const name =
        typeof body.name === 'string' ? body.name.normalize('NFC') : '';
      if (body.purpose === 'cadastro' && !nomeValido(name)) {
        throw new AppError(
          400,
          'NOME_INVALIDO',
          'Use Nome e Sobrenome, com um único espaço e até 21 caracteres.',
        );
      }

      await providers.assertReady();

      if (body.purpose === 'cadastro') {
        const exists = await providers.rpc('lc_auth_email_exists', {
          p_email: email,
        });

        if (exists === true) {
          return {
            ok: true,
            id: randomUUID(),
            token: randomBytes(32).toString('hex'),
          };
        }

        if (exists !== false)
          throw new AppError(
            503,
            'CONSULTA_EMAIL_FALHOU',
            'Não foi possível conferir os dados agora. Tente novamente mais tarde.',
          );
      }

      if (
        body.purpose === 'recuperacao' &&
        providers.recoveryExists &&
        (await providers.recoveryExists(email)) === false
      ) {
        return {
          ok: true,
          id: randomUUID(),
          token: randomBytes(32).toString('hex'),
        };
      }

      const id = randomUUID();
      const token = randomBytes(32).toString('hex');
      const binding = { p_id: id, p_token_mac: mac('token', token) };
      let code;
      let result;

      for (let n = 0; n < 20; n++) {
        code = generateCode();
        result = await providers.rpc('lc_auth_start', {
          ...binding,
          p_email_key: emailKey,
          p_purpose: body.purpose,
          p_code_mac: mac('code', id, emailKey, body.purpose, code),
          p_fingerprint: mac('last', emailKey, code),
        });
        if (result.reason !== 'repeat') break;
      }

      if (result.reason === 'rate_limit')
        return {
          ok: true,
          id: randomUUID(),
          token: randomBytes(32).toString('hex'),
        };
      if (result.ok !== true)
        throw new AppError(
          503,
          'GERACAO_FALHOU',
          'Não foi possível iniciar a verificação. Tente novamente.',
        );

      try {
        await providers.send({
          purpose: body.purpose,
          email,
          name: name || 'Usuário',
          code,
        });
        if ((await providers.rpc('lc_auth_activate', binding)) !== true) {
          throw new AppError(
            409,
            'TENTATIVA_INVALIDA',
            'Outra tentativa foi iniciada. Utilize o código da tentativa mais recente.',
          );
        }
      } catch (error) {
        await providers.rpc('lc_auth_cancel', binding).catch(() => {});
        throw error;
      }

      return { ok: true, id, token };
    }

    if (
      !['confirm-signup', 'verify-recovery', 'reset-password'].includes(
        body.action,
      )
    )
      throw bad();

    const binding = attempt(body);
    if (body.action === 'reset-password' || body.action === 'confirm-signup') {
      if (!senhaValida(body.password))
        throw new AppError(
          400,
          'SENHA_INVALIDA',
          'A senha deve cumprir os requisitos e ter no máximo 128 caracteres.',
        );
    }
    if (body.action === 'confirm-signup' && !nomeValido(body.name))
      throw new AppError(400, 'NOME_INVALIDO', 'Confira Nome e Sobrenome.');

    await providers.assertReady();

    if (body.action === 'reset-password') {
      if (
        (await providers.rpc('lc_auth_consume_reset', {
          ...binding,
          p_email_key: emailKey,
        })) !== true
      ) {
        throw new AppError(
          400,
          'TENTATIVA_INVALIDA',
          'Confirme seu e-mail em uma nova tentativa.',
        );
      }
      await providers.reset(email, body.password);
      return { ok: true };
    }

    if (!/^\d{4}$/.test(body.code ?? ''))
      throw new AppError(
        400,
        'CODIGO_INVALIDO',
        'Informe o código de 4 dígitos.',
      );

    const purpose =
      body.action === 'confirm-signup' ? 'cadastro' : 'recuperacao';
    const resetToken = randomBytes(32).toString('hex');

    checkResult(
      await providers.rpc('lc_auth_verify', {
        ...binding,
        p_email_key: emailKey,
        p_purpose: purpose,
        p_code_mac: mac('code', body.id, emailKey, purpose, body.code),
        p_reset_mac:
          purpose === 'recuperacao' ? mac('token', resetToken) : null,
      }),
    );

    if (purpose === 'recuperacao')
      return { ok: true, id: body.id, token: resetToken };

    await providers.signup(email, body.password, body.name.normalize('NFC'));
    return { ok: true };
  };
}
