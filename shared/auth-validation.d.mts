export const EMAIL_VALIDO: RegExp;
export const NOME_MAXIMO: number;
export const ERRO_NOME: string;
export function normalizarEmail(email: unknown): string;
export function nomeValido(nome: unknown): boolean;
export function emailValido(email: unknown): boolean;
export function senhaValida(senha: unknown): boolean;
export function requisitosSenha(senha: string): { id: string; texto: string; valido: boolean }[];
