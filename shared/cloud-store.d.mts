import type { DadosConta } from '../src/types/index';
export function emptyData(): DadosConta;
export interface CloudState {
  owner: string;
  email: string;
  status: 'idle' | 'loading' | 'ready' | 'saving' | 'error' | 'conflict';
  data: DadosConta;
  revision: number;
  epoch: number;
  dirty: boolean;
  error: string;
  notice: string;
}
export interface CloudDriver {
  load(
    owner: string,
    email: string,
  ): Promise<{ data: DadosConta; revision: number; notice?: string }>;
  save(
    owner: string,
    revision: number,
    operation: string,
    data: DadosConta,
  ): Promise<{ ok: boolean; revision: number }>;
}
export class CloudStore {
  constructor(driver: CloudDriver);
  getSnapshot: () => CloudState;
  subscribe: (fn: () => void) => () => void;
  reset(): void;
  connect(owner: string, email: string): Promise<void>;
  load(initial?: boolean): Promise<void>;
  mutate(change: (data: DadosConta) => void): void;
  flush(): Promise<void>;
  retry(): Promise<void>;
  reload(): Promise<void>;
}
