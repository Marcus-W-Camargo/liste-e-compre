import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Conta } from '../src/pages/Conta';

vi.mock('../src/utils/auth', () => ({ autenticarUsuario: vi.fn() }));
const attempt = {
  id: '11111111-1111-4111-8111-111111111111',
  token: 'a'.repeat(64),
};
const renewed = { ...attempt, token: 'b'.repeat(64) };
let requests: Record<string, unknown>[];
let handler: (body: Record<string, unknown>) => {
  status?: number;
  body: unknown;
};

beforeEach(() => {
  requests = [];
  handler = (body) => ({
    body: body.action === 'start' ? attempt : { ok: true },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, options: RequestInit) => {
      const body = JSON.parse(options.body as string);
      requests.push(body);
      const result = handler(body);
      return new Response(JSON.stringify(result.body), {
        status: result.status ?? 200,
      });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function open(mode = 'cadastro') {
  return render(
    <MemoryRouter initialEntries={['/conta?modo=' + mode]}>
      <Conta />
    </MemoryRouter>,
  );
}
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
function fillSignup() {
  fill('Nome e Sobrenome', 'Teste Local');
  fill('E-mail', 'teste@example.com');
  fill('Senha', 'Teste123!');
  fill('Repita sua senha', 'Teste123!');
}
async function startSignup() {
  fillSignup();
  fireEvent.submit(screen.getByLabelText('E-mail').closest('form')!);
  await screen.findByRole('heading', { name: 'Verifique seu e-mail' });
}
function fillCode() {
  for (let i = 1; i <= 4; i++) fill(`Dígito ${i} do código`, String(i));
}

describe('formulário real, com rede simulada', () => {
  it('e-mail existente permanece no formulário; corrigir o endereço permite nova tentativa', async () => {
    handler = () => ({
      status: 409,
      body: {
        code: 'CONTA_EXISTENTE',
        error: 'Este e-mail já possui uma conta. Entre ou recupere sua senha.',
      },
    });
    open();
    fillSignup();
    fireEvent.submit(screen.getByLabelText('E-mail').closest('form')!);
    await screen.findByText(
      'Este e-mail já possui uma conta. Entre ou recupere sua senha.',
    );
    expect(
      screen.queryByRole('heading', { name: 'Verifique seu e-mail' }),
    ).toBeNull();
    expect(screen.queryByLabelText('Dígito 1 do código')).toBeNull();
    expect((screen.getByLabelText('E-mail') as HTMLInputElement).value).toBe(
      'teste@example.com',
    );
    expect(
      (screen.getByLabelText('Nome e Sobrenome') as HTMLInputElement).value,
    ).toBe('Teste Local');
    const form = screen.getByLabelText('E-mail').closest('form')!;
    expect(
      (within(form).getByRole('button', { name: 'Cadastrar' }) as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(requests).toEqual([{
      action: 'start',
      purpose: 'cadastro',
      email: 'teste@example.com',
      name: 'Teste Local',
    }]);
    handler = () => ({ body: attempt });
    fill('E-mail', 'novo@example.com');
    fireEvent.submit(screen.getByLabelText('E-mail').closest('form')!);
    await screen.findByRole('heading', { name: 'Verifique seu e-mail' });
    expect(requests).toHaveLength(2);
    expect(requests[1]).toEqual({
      action: 'start',
      purpose: 'cadastro',
      email: 'novo@example.com',
      name: 'Teste Local',
    });
  });

  it('não envia a senha ao iniciar; confirma exclusivamente pela API, sem reenvio/contador', async () => {
    open();
    await startSignup();
    expect(requests[0]).toEqual({
      action: 'start',
      purpose: 'cadastro',
      email: 'teste@example.com',
      name: 'Teste Local',
    });
    expect(screen.queryByText(/reenviar|expira|restante/i)).toBeNull();
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
    fillCode();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Código' }));
    await screen.findByText('Cadastro confirmado. Faça login para continuar.');
    expect(requests[1]).toEqual({
      action: 'confirm-signup',
      ...attempt,
      email: 'teste@example.com',
      name: 'Teste Local',
      password: 'Teste123!',
      code: '1234',
    });
    expect(requests.filter((r) => r.action === 'cancel')).toHaveLength(0);
  });

  it('trocar para o app de e-mail não cancela; corrigir o endereço cancela', async () => {
    open();
    await startSignup();
    fireEvent(window, new Event('blur'));
    fireEvent(document, new Event('visibilitychange'));
    fireEvent(window, new Event('focus'));
    expect(requests).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'clique aqui' }));
    await screen.findByLabelText('Nome e Sobrenome');
    expect(requests[1]).toEqual({ action: 'cancel', ...attempt });
  });

  it('sair da página descarta a tentativa, sem gravá-la no armazenamento do navegador', async () => {
    const view = open();
    await startSignup();
    view.unmount();
    expect(requests[1]).toEqual({ action: 'cancel', ...attempt });
    expect(JSON.stringify(localStorage)).not.toContain(attempt.token);
    expect(JSON.stringify(sessionStorage)).not.toContain(attempt.token);
  });

  it('pagehide cancela; voltar pelo histórico não restaura a tentativa', async () => {
    open();
    await startSignup();
    fireEvent(window, new Event('pagehide'));
    fireEvent(window, new Event('pageshow'));
    expect(
      screen.queryByRole('heading', { name: 'Verifique seu e-mail' }),
    ).toBeNull();
    expect(requests[1]).toEqual({ action: 'cancel', ...attempt });
  });

  it('não mostra sucesso se o servidor rejeitar o código e reinicia após bloqueio', async () => {
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

  it('recuperação usa a nova prova retornada pelo servidor, não o código já consumido', async () => {
    open('login');
    fireEvent.click(
      screen.getByRole('button', { name: 'Esqueci minha senha' }),
    );
    fill('E-mail cadastrado', 'teste@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
    await screen.findByLabelText('Código');
    handler = (body) => ({
      body: body.action === 'verify-recovery' ? renewed : { ok: true },
    });
    fill('Código', '1234');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar código' }));
    await screen.findByLabelText('Nova senha');
    fill('Nova senha', 'Nova123!');
    fill('Repita a nova senha', 'Nova123!');
    fireEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }));
    await screen.findByText('Senha redefinida com sucesso.');
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(requests[1]).toEqual({
      action: 'verify-recovery',
      ...attempt,
      email: 'teste@example.com',
      code: '1234',
    });
    expect(requests[2]).toEqual({
      action: 'reset-password',
      ...renewed,
      email: 'teste@example.com',
      password: 'Nova123!',
    });
  });
});
