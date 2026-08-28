export interface Tentativa {
  id: string;
  token: string;
}
export class ErroAutenticacao extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}
export async function solicitarAuth<T = { ok: true }>(
  body: Record<string, unknown>,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    throw new ErroAutenticacao(
      'Não foi possível conectar ao servidor. Confira sua conexão.',
      'CONEXAO',
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new ErroAutenticacao(
      'A API não está disponível. Confira se o servidor está em execução.',
      'API_INDISPONIVEL',
    );
  }
  if (!response.ok)
    throw new ErroAutenticacao(
      result.error ?? 'Não foi possível concluir a operação.',
      result.code ?? 'ERRO',
    );
  return result as T;
}
export function cancelarTentativa(tentativa: Tentativa) {
  void fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel', ...tentativa }),
    keepalive: true,
  }).catch(() => {});
}
