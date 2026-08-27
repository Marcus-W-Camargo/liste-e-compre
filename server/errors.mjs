export class AuthError extends Error {
  constructor(status, message, retryAfter = 0) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export const verificationError = () => new AuthError(400,
  'Código inválido, expirado ou já utilizado. Confira o e-mail ou solicite outro código.');
