import type { DadosConta } from '../src/types/index';
export function validData(data: unknown): data is DadosConta;
export function readLegacy(
  storage: Pick<Storage, 'getItem'>,
  email: string,
): { data: DadosConta | null; invalid: boolean };
