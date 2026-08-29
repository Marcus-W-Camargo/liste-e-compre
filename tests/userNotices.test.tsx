import { afterEach, describe, expect, it } from 'vitest';
import {
  deveMostrarAvisoConexao,
  deveMostrarGuiaNavegacao,
  marcarAvisoConexaoComoVisto,
  marcarGuiaNavegacaoComoVisto,
} from '../src/utils/userNotices';

afterEach(() => localStorage.clear());

describe('avisos informativos por usuário', () => {
  it('mostra o aviso de conexão somente ao salvar a primeira lista', () => {
    expect(deveMostrarAvisoConexao('usuario-1', 0)).toBe(true);
    expect(deveMostrarAvisoConexao('usuario-1', 1)).toBe(false);
  });

  it('não compartilha a confirmação de conexão entre contas', () => {
    marcarAvisoConexaoComoVisto('usuario-1');

    expect(deveMostrarAvisoConexao('usuario-1', 0)).toBe(false);
    expect(deveMostrarAvisoConexao('usuario-2', 0)).toBe(true);
  });

  it('não compartilha o guia de navegação entre contas', () => {
    marcarGuiaNavegacaoComoVisto('usuario-1', 'mobile');

    expect(deveMostrarGuiaNavegacao('usuario-1', 'mobile')).toBe(false);
    expect(deveMostrarGuiaNavegacao('usuario-2', 'mobile')).toBe(true);
  });

  it('controla separadamente as orientações mobile e desktop', () => {
    marcarGuiaNavegacaoComoVisto('usuario-1', 'desktop');

    expect(deveMostrarGuiaNavegacao('usuario-1', 'desktop')).toBe(false);
    expect(deveMostrarGuiaNavegacao('usuario-1', 'mobile')).toBe(true);
  });
});
