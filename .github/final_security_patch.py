from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if text.count(old) != 1:
        raise SystemExit(
            f'{path}: trecho esperado ocorreu {text.count(old)} vez(es)'
        )
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


replace_once(
    'server/auth-controller.mjs',
    """      if (result.reason === 'rate_limit')
        throw new AppError(
          429,
          'LIMITE_ENVIOS',
          `Limite de envios atingido. Tente novamente em ${Math.ceil(result.retryAfter / 60)} minuto(s).`,
          result.retryAfter,
        );
""",
    """      if (result.reason === 'rate_limit')
        return {
          ok: true,
          id: randomUUID(),
          token: randomBytes(32).toString('hex'),
        };
""",
)

replace_once(
    'tests/auth.test.mjs',
    """test('limite de envio devolve Retry-After e não chama EmailJS', async () => {
  const f = fixture({
    rpc: async (fn) =>
      fn === 'lc_auth_email_exists'
        ? false
        : { ok: false, reason: 'rate_limit', retryAfter: 2700 },
  });
  await assert.rejects(
    f.handle(startBody),
    (e) => e.status === 429 && e.retryAfter === 2700,
  );
  assert.equal(f.sent.length, 0);
});
""",
    """test('limite específico de e-mail devolve tentativa sintética e não chama EmailJS', async () => {
  const f = fixture({
    rpc: async (fn) =>
      fn === 'lc_auth_email_exists'
        ? false
        : { ok: false, reason: 'rate_limit', retryAfter: 2700 },
  });
  const result = await f.handle(startBody);
  assert.deepEqual(Object.keys(result).sort(), ['id', 'ok', 'token']);
  assert.equal(result.ok, true);
  assert.match(result.id, /^[a-f0-9-]{36}$/);
  assert.match(result.token, /^[a-f0-9]{64}$/);
  assert.equal(f.sent.length, 0);
  assert.equal(f.attempts.size, 0);
});
""",
)

p = Path('tests/auth-enumeration.test.mjs')
text = p.read_text(encoding='utf-8')
old = (
    'function createFixture({ signupExists = false, recoveryExists = true } = {}) {\n'
    '  const attempts = new Map();\n'
    '  const sent = [];\n'
    '  const calls = [];\n'
)
new = (
    'function createFixture({\n'
    '  signupExists = false,\n'
    '  recoveryExists = true,\n'
    '  startLimitAfter = Infinity,\n'
    '} = {}) {\n'
    '  const attempts = new Map();\n'
    '  const sent = [];\n'
    '  const calls = [];\n'
    '  let starts = 0;\n'
)
if text.count(old) != 1:
    raise SystemExit('tests/auth-enumeration.test.mjs: assinatura da fixture inesperada')
text = text.replace(old, new, 1)
old = """      if (fn === 'lc_auth_start') {
        attempts.set(params.p_id, {
          ...params,
          stage: 'sending',
          errors: 0,
        });
        return { ok: true };
      }
"""
new = """      if (fn === 'lc_auth_start') {
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
"""
if text.count(old) != 1:
    raise SystemExit('tests/auth-enumeration.test.mjs: lc_auth_start inesperado')
text = text.replace(old, new, 1)
append = r'''

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
'''
if 'cadastro mantém start neutro quando a cota específica de e-mail é excedida' in text:
    raise SystemExit('testes de rate limit já existem')
p.write_text(text.rstrip() + append + '\n', encoding='utf-8')

p = Path('src/pages/Conta.tsx')
text = p.read_text(encoding='utf-8')
old = """  const tentativa = useRef<Tentativa | null>(null);
  const geracao = useRef(0);
  const montado = useRef(true);

  function abandonarTentativa() {
    geracao.current++;
    if (tentativa.current) cancelarTentativa(tentativa.current);
    tentativa.current = null;
  }
"""
new = """  const tentativa = useRef<Tentativa | null>(null);
  const geracao = useRef(0);
  const montado = useRef(true);
  const errosVerificacaoCadastro = useRef(0);
  const errosVerificacaoRecuperacao = useRef(0);

  function abandonarTentativa() {
    geracao.current++;
    if (tentativa.current) cancelarTentativa(tentativa.current);
    tentativa.current = null;
    errosVerificacaoCadastro.current = 0;
    errosVerificacaoRecuperacao.current = 0;
  }
"""
if text.count(old) != 1:
    raise SystemExit('Conta.tsx: refs/abandono inesperados')
text = text.replace(old, new, 1)
old = """      tentativa.current = null;

      setCadastroConfirmacao(false);
      setCodigoCadastro('');
"""
new = """      tentativa.current = null;
      errosVerificacaoCadastro.current = 0;

      setCadastroConfirmacao(false);
      setCodigoCadastro('');
"""
if text.count(old) != 1:
    raise SystemExit('Conta.tsx: sucesso cadastro inesperado')
text = text.replace(old, new, 1)
old = """    } catch (error) {
      tratarErro(error, 'Código de confirmação inválido.');
    } finally {
      setProcessando(false);
    }
  }

  function alterarDigitoCadastro"""
new = """    } catch (error) {
      if (
        error instanceof ErroAutenticacao &&
        error.code === 'VERIFICACAO_INVALIDA'
      ) {
        errosVerificacaoCadastro.current++;
        if (errosVerificacaoCadastro.current >= 5) {
          abandonarTentativa();
          setCadastroConfirmacao(false);
          setCodigoCadastro('');
          setErro(
            'Não foi possível confirmar o código. Inicie uma nova tentativa.',
          );
          return;
        }
      }
      tratarErro(error, 'Código de confirmação inválido.');
    } finally {
      setProcessando(false);
    }
  }

  function alterarDigitoCadastro"""
if text.count(old) != 1:
    raise SystemExit('Conta.tsx: catch cadastro inesperado')
text = text.replace(old, new, 1)
old = """        tentativa.current = autorizacao;
        setEtapaRecuperacao('senha');
        setCodigo('');
"""
new = """        tentativa.current = autorizacao;
        errosVerificacaoRecuperacao.current = 0;
        setEtapaRecuperacao('senha');
        setCodigo('');
"""
if text.count(old) != 1:
    raise SystemExit('Conta.tsx: sucesso recuperação inesperado')
text = text.replace(old, new, 1)
old = """    } catch (error) {
      tratarErro(error, 'Não foi possível concluir a recuperação.');
    } finally {
      setProcessando(false);
    }
  }

  return ("""
new = """    } catch (error) {
      if (
        etapaRecuperacao === 'codigo' &&
        error instanceof ErroAutenticacao &&
        error.code === 'VERIFICACAO_INVALIDA'
      ) {
        errosVerificacaoRecuperacao.current++;
        if (errosVerificacaoRecuperacao.current >= 5) {
          abandonarTentativa();
          setEtapaRecuperacao('email');
          setCodigo('');
          setErro(
            'Não foi possível confirmar o código. Inicie uma nova tentativa.',
          );
          return;
        }
      }
      tratarErro(error, 'Não foi possível concluir a recuperação.');
    } finally {
      setProcessando(false);
    }
  }

  return ("""
if text.count(old) != 1:
    raise SystemExit('Conta.tsx: catch recuperação inesperado')
p.write_text(text.replace(old, new, 1), encoding='utf-8')

p = Path('tests/Conta.test.tsx')
text = p.read_text(encoding='utf-8')
old = """  it('não mostra sucesso se o servidor rejeitar o código e reinicia após bloqueio', async () => {
    open();
    await startSignup();
    handler = () => ({
      status: 400,
      body: {
        error: 'Tentativa encerrada após cinco erros.',
        code: 'TENTATIVA_BLOQUEADA',
      },
    });
    fillCode();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Código' }));
    await screen.findByText('Tentativa encerrada após cinco erros.');
    expect(screen.getByLabelText('Nome e Sobrenome')).toBeTruthy();
    expect(screen.queryByText(/Cadastro confirmado/)).toBeNull();
  });
"""
new = """  it.each([
    ['real', attempt],
    [
      'sintética',
      {
        id: '22222222-2222-4222-8222-222222222222',
        token: 'c'.repeat(64),
      },
    ],
  ])(
    'cadastro mantém quatro erros neutros e reinicia no quinto para tentativa %s',
    async (_origem, tentativaInicial) => {
      handler = (body) => {
        if (body.action === 'start') return { body: tentativaInicial };
        if (body.action === 'confirm-signup')
          return {
            status: 400,
            body: {
              ok: false,
              code: 'VERIFICACAO_INVALIDA',
              error:
                'Não foi possível confirmar o código. Confira os dados ou inicie uma nova tentativa.',
            },
          };
        return { body: { ok: true } };
      };
      open();
      await startSignup();
      fillCode();

      for (let erro = 1; erro <= 4; erro++) {
        fireEvent.click(
          screen.getByRole('button', { name: 'Confirmar Código' }),
        );
        await waitFor(() =>
          expect(
            requests.filter((request) => request.action === 'confirm-signup'),
          ).toHaveLength(erro),
        );
        expect(screen.getByLabelText('Dígito 1 do código')).toBeTruthy();
        await waitFor(() =>
          expect(
            (
              screen.getByRole('button', {
                name: 'Confirmar Código',
              }) as HTMLButtonElement
            ).disabled,
          ).toBe(false),
        );
      }

      fireEvent.click(screen.getByRole('button', { name: 'Confirmar Código' }));
      await screen.findByLabelText('Nome e Sobrenome');
      expect(
        requests.filter((request) => request.action === 'confirm-signup'),
      ).toHaveLength(5);
      expect(screen.queryByLabelText('Dígito 1 do código')).toBeNull();
      expect(
        screen.getByText(
          'Não foi possível confirmar o código. Inicie uma nova tentativa.',
        ),
      ).toBeTruthy();
      expect(screen.queryByText(/Cadastro confirmado/)).toBeNull();
    },
  );

  it.each([
    ['real', attempt],
    [
      'sintética',
      {
        id: '33333333-3333-4333-8333-333333333333',
        token: 'd'.repeat(64),
      },
    ],
  ])(
    'recuperação mantém quatro erros neutros e reinicia no quinto para tentativa %s',
    async (_origem, tentativaInicial) => {
      handler = (body) => {
        if (body.action === 'start') return { body: tentativaInicial };
        if (body.action === 'verify-recovery')
          return {
            status: 400,
            body: {
              ok: false,
              code: 'VERIFICACAO_INVALIDA',
              error:
                'Não foi possível confirmar o código. Confira os dados ou inicie uma nova tentativa.',
            },
          };
        return { body: { ok: true } };
      };
      open('login');
      fireEvent.click(
        screen.getByRole('button', { name: 'Esqueci minha senha' }),
      );
      fill('E-mail cadastrado', 'teste@example.com');
      fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
      await screen.findByLabelText('Código');
      fill('Código', '1234');

      for (let erro = 1; erro <= 4; erro++) {
        fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }));
        await waitFor(() =>
          expect(
            requests.filter((request) => request.action === 'verify-recovery'),
          ).toHaveLength(erro),
        );
        expect(screen.getByLabelText('Código')).toBeTruthy();
        await waitFor(() =>
          expect(
            (
              screen.getByRole('button', {
                name: 'Confirmar código',
              }) as HTMLButtonElement
            ).disabled,
          ).toBe(false),
        );
      }

      fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }));
      await screen.findByLabelText('E-mail cadastrado');
      expect(
        requests.filter((request) => request.action === 'verify-recovery'),
      ).toHaveLength(5);
      expect(screen.queryByLabelText('Código')).toBeNull();
      expect(
        screen.getByText(
          'Não foi possível confirmar o código. Inicie uma nova tentativa.',
        ),
      ).toBeTruthy();
    },
  );
"""
if text.count(old) != 1:
    raise SystemExit('Conta.test.tsx: teste antigo inesperado')
p.write_text(text.replace(old, new, 1), encoding='utf-8')
