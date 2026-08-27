export const EMAIL_VALIDO = /^\S+@\S+\.\S+$/;
export const NOME_MAXIMO = 21;
export const ERRO_NOME = 'Use apenas nome e sobrenome, separados por um único espaço, com até 21 caracteres.';

export function normalizarEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function nomeValido(nome) {
  return typeof nome === 'string'
    && Array.from(nome.normalize('NFC')).length <= NOME_MAXIMO
    && /^\p{L}+ \p{L}+$/u.test(nome.normalize('NFC'));
}

export function emailValido(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_VALIDO.test(email);
}

export function requisitosSenha(senha) {
  return [
    { id: 'tamanho', texto: 'Pelo menos 6 caracteres', valido: senha.length >= 6 },
    { id: 'numero', texto: 'Pelo menos 1 número', valido: /\d/.test(senha) },
    { id: 'especial', texto: 'Pelo menos um caractere especial', valido: /[!@#$%&*/?_-]/.test(senha) },
    { id: 'letras', texto: 'A senha não pode ser numérica', valido: /[a-zA-ZÀ-ÿ]/.test(senha) },
  ];
}

export function senhaValida(senha) {
  return typeof senha === 'string' && senha.length <= 128
    && new TextEncoder().encode(senha).length <= 72
    && !senha.includes('\0') && requisitosSenha(senha).every((item) => item.valido);
}
