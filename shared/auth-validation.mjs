export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function normalizarEmail(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}
export function emailValido(value) {
  return (
    typeof value === 'string' && value.length <= 254 && EMAIL_VALIDO.test(value)
  );
}
export function nomeValido(value) {
  return (
    typeof value === 'string' &&
    Array.from(value.normalize('NFC')).length <= 21 &&
    /^\p{L}+ \p{L}+$/u.test(value.normalize('NFC'))
  );
}
export function senhaValida(value) {
  return (
    typeof value === 'string' &&
    value.length >= 6 &&
    value.length <= 128 &&
    /\d/.test(value) &&
    /[!@#$%&*/?_-]/.test(value) &&
    /[a-zA-ZÀ-ÿ]/.test(value)
  );
}
