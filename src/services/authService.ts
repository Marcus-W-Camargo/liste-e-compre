import { normalizarEmail } from '../../shared/auth-validation.mjs';
async function solicitar(dados: Record<string, string>) {
  let response: Response;
  try {
    response = await fetch('/api/auth', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
  } catch {
    throw new Error('Sem conexão com o servidor. Confira sua internet e tente novamente.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const wait = Number(response.headers.get('Retry-After'));
    if (response.status === 429 && wait > 0) {
      throw new Error(`Aguarde ${Math.ceil(wait / 60)} minuto(s) antes de tentar novamente.`);
    }
    throw new Error(data?.error || 'O serviço de autenticação está indisponível. Tente novamente mais tarde.');
  }
  if (data?.ok !== true) throw new Error('Resposta inesperada do servidor. Tente novamente.');
}
export const iniciarCadastro = (nome: string, email: string) =>
  solicitar({ action: 'start', type: 'cadastro', nome, email: normalizarEmail(email) });
export const confirmarCadastro = (nome: string, email: string, senha: string, codigo: string) =>
  solicitar({ action: 'confirm-signup', nome, email: normalizarEmail(email), senha, codigo });
export const iniciarRecuperacao = (email: string) =>
  solicitar({ action: 'start', type: 'recuperacao', email: normalizarEmail(email) });
export const confirmarRecuperacao = (email: string, codigo: string) =>
  solicitar({ action: 'verify-recovery', email: normalizarEmail(email), codigo });
export const redefinirSenha = (email: string, senha: string) =>
  solicitar({ action: 'reset-password', email: normalizarEmail(email), senha });
