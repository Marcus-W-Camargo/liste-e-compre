const CHAVE_STATUS = 'usuarioLogado';
const CHAVE_NOME = 'nomeUsuario';
const CHAVE_TIMER = 'timestampSessao';
const EVENTO_SESSAO_ALTERADA = 'sessao-alterada';
const TEMPO_EXPIRACAO = 3 * 60 * 60 * 1000; // 3 horas

export interface SessaoUsuario {
  logado: boolean;
  nome: string;
  email: string;
}

export function obterSessao(): SessaoUsuario {
  try {
    const logadoLS =
      localStorage.getItem(CHAVE_STATUS) === 'true' ||
      sessionStorage.getItem(CHAVE_STATUS) === 'true';

    if (!logadoLS) {
      return { logado: false, nome: '', email: '' };
    }

    // Checa expiração (somente localStorage tem timer)
    const ultimoAcesso = localStorage.getItem(CHAVE_TIMER);
    if (ultimoAcesso) {
      const agora = Date.now();
      if (agora - parseInt(ultimoAcesso, 10) > TEMPO_EXPIRACAO) {
        limparSessao();
        return { logado: false, nome: '', email: '' };
      }
      localStorage.setItem(CHAVE_TIMER, String(agora));
    }

    const nome =
      localStorage.getItem(CHAVE_NOME) ||
      sessionStorage.getItem(CHAVE_NOME) ||
      'Usuário';
    const email =
      localStorage.getItem('emailUsuario') ||
      sessionStorage.getItem('emailUsuario') ||
      '';

    return { logado: true, nome, email };
  } catch {
    return { logado: false, nome: '', email: '' };
  }
}

export function salvarSessao(nome: string, email: string): void {
  const emailNormalizado = email.trim().toLowerCase();
  localStorage.setItem(CHAVE_STATUS, 'true');
  localStorage.setItem(CHAVE_NOME, nome);
  localStorage.setItem('emailUsuario', emailNormalizado);
  localStorage.setItem(CHAVE_TIMER, String(Date.now()));
  sessionStorage.setItem(CHAVE_STATUS, 'true');
  sessionStorage.setItem(CHAVE_NOME, nome);
  sessionStorage.setItem('emailUsuario', emailNormalizado);
  window.dispatchEvent(new Event(EVENTO_SESSAO_ALTERADA));
}

export function limparSessao(): void {
  localStorage.removeItem(CHAVE_STATUS);
  localStorage.removeItem(CHAVE_NOME);
  localStorage.removeItem('emailUsuario');
  localStorage.removeItem(CHAVE_TIMER);
  sessionStorage.removeItem(CHAVE_STATUS);
  sessionStorage.removeItem(CHAVE_NOME);
  sessionStorage.removeItem('emailUsuario');
}
