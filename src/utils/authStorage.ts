const CHAVE_USUARIOS = 'usuarios_local';
const CHAVE_VERIFICACOES = 'verificacoes_email';
const DURACAO_CODIGO_MS = 10 * 60 * 1000;

interface UsuarioArmazenado {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  criadoEm: number;
}

interface VerificacaoArmazenada {
  tipo: 'cadastro' | 'recuperacao';
  nome: string;
  email: string;
  senhaHash?: string;
  codigo: string;
  expiraEm: number;
  codigoConfirmado: boolean;
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

function lerUsuarios(): UsuarioArmazenado[] {
  try {
    const dados = localStorage.getItem(CHAVE_USUARIOS);
    return dados ? JSON.parse(dados) : [];
  } catch {
    return [];
  }
}

function salvarUsuarios(usuarios: UsuarioArmazenado[]): void {
  localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));
}

function lerVerificacoes(): VerificacaoArmazenada[] {
  try {
    const dados = localStorage.getItem(CHAVE_VERIFICACOES);
    return dados ? JSON.parse(dados) : [];
  } catch {
    return [];
  }
}

function salvarVerificacoes(
  verificacoes: VerificacaoArmazenada[],
): void {
  localStorage.setItem(
    CHAVE_VERIFICACOES,
    JSON.stringify(verificacoes),
  );
}

function gerarCodigo(): string {
  const valores = new Uint32Array(1);
  crypto.getRandomValues(valores);

  return String(valores[0] % 10000).padStart(4, '0');
}

function gerarId(): string {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function gerarHash(valor: string): Promise<string> {
  const dados = new TextEncoder().encode(valor);
  const hash = await crypto.subtle.digest('SHA-256', dados);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function limparVerificacoesExpiradas(): void {
  const agora = Date.now();

  const validas = lerVerificacoes().filter(
    (verificacao) => verificacao.expiraEm > agora,
  );

  salvarVerificacoes(validas);
}

export async function iniciarCadastro(
  nome: string,
  email: string,
  senha: string,
): Promise<string> {
  limparVerificacoesExpiradas();

  const emailNormalizado = normalizarEmail(email);
  const usuarios = lerUsuarios();

  if (
    usuarios.some(
      (usuario) => usuario.email === emailNormalizado,
    )
  ) {
    throw new Error('Este e-mail já está cadastrado.');
  }

  const verificacoes = lerVerificacoes().filter(
    (verificacao) =>
      verificacao.email !== emailNormalizado ||
      verificacao.tipo !== 'cadastro',
  );

  const verificacao: VerificacaoArmazenada = {
    tipo: 'cadastro',
    nome: nome.trim(),
    email: emailNormalizado,
    senhaHash: await gerarHash(senha),
    codigo: gerarCodigo(),
    expiraEm: Date.now() + DURACAO_CODIGO_MS,
    codigoConfirmado: false,
  };

  salvarVerificacoes([...verificacoes, verificacao]);

  return verificacao.codigo;
}

export function obterNomeVerificacao(email: string): string {
  const emailNormalizado = normalizarEmail(email);

  return (
    lerVerificacoes().find(
      (verificacao) =>
        verificacao.email === emailNormalizado,
    )?.nome ?? ''
  );
}

export function confirmarCadastro(
  email: string,
  codigo: string,
): void {
  limparVerificacoesExpiradas();

  const emailNormalizado = normalizarEmail(email);
  const verificacoes = lerVerificacoes();

  const verificacao = verificacoes.find(
    (item) =>
      item.tipo === 'cadastro' &&
      item.email === emailNormalizado,
  );

  if (!verificacao || verificacao.codigo !== codigo) {
    throw new Error('Código de confirmação inválido.');
  }

  if (!verificacao.senhaHash) {
    throw new Error('Dados de cadastro incompletos.');
  }

  const usuarios = lerUsuarios();

  usuarios.push({
    id: gerarId(),
    nome: verificacao.nome,
    email: verificacao.email,
    senhaHash: verificacao.senhaHash,
    criadoEm: Date.now(),
  });

  salvarUsuarios(usuarios);
  salvarVerificacoes(
    verificacoes.filter((item) => item !== verificacao),
  );
}

export async function autenticarUsuario(
  email: string,
  senha: string,
): Promise<UsuarioArmazenado> {
  const emailNormalizado = normalizarEmail(email);
  const senhaHash = await gerarHash(senha);

  const usuario = lerUsuarios().find(
    (item) =>
      item.email === emailNormalizado &&
      item.senhaHash === senhaHash,
  );

  if (!usuario) {
    throw new Error('E-mail ou senha inválidos.');
  }

  return usuario;
}

export function iniciarRecuperacao(
  email: string,
): string | null {
  limparVerificacoesExpiradas();

  const emailNormalizado = normalizarEmail(email);
  const usuario = lerUsuarios().find(
    (item) => item.email === emailNormalizado,
  );

  if (!usuario) {
    return null;
  }

  const verificacoes = lerVerificacoes().filter(
    (verificacao) =>
      verificacao.email !== emailNormalizado ||
      verificacao.tipo !== 'recuperacao',
  );

  const verificacao: VerificacaoArmazenada = {
    tipo: 'recuperacao',
    nome: usuario.nome,
    email: emailNormalizado,
    codigo: gerarCodigo(),
    expiraEm: Date.now() + DURACAO_CODIGO_MS,
    codigoConfirmado: false,
  };

  salvarVerificacoes([...verificacoes, verificacao]);

  return verificacao.codigo;
}

export function confirmarRecuperacao(
  email: string,
  codigo: string,
): void {
  limparVerificacoesExpiradas();

  const emailNormalizado = normalizarEmail(email);
  const verificacoes = lerVerificacoes();

  const indice = verificacoes.findIndex(
    (item) =>
      item.tipo === 'recuperacao' &&
      item.email === emailNormalizado,
  );

  if (
    indice === -1 ||
    verificacoes[indice].codigo !== codigo
  ) {
    throw new Error('Código de recuperação inválido.');
  }

  verificacoes[indice].codigoConfirmado = true;
  salvarVerificacoes(verificacoes);
}
export function obterNomeUsuario(email: string): string {
  const emailNormalizado = normalizarEmail(email);

  return (
    lerUsuarios().find(
      (usuario) => usuario.email === emailNormalizado,
    )?.nome ?? ''
  );
}
export async function redefinirSenha(
  email: string,
  novaSenha: string,
): Promise<void> {
  const emailNormalizado = normalizarEmail(email);
  const verificacoes = lerVerificacoes();

  const verificacao = verificacoes.find(
    (item) =>
      item.tipo === 'recuperacao' &&
      item.email === emailNormalizado &&
      item.codigoConfirmado,
  );

  if (!verificacao) {
    throw new Error('A recuperação não foi confirmada.');
  }

  const usuarios = lerUsuarios();
  const indiceUsuario = usuarios.findIndex(
    (usuario) => usuario.email === emailNormalizado,
  );

  if (indiceUsuario === -1) {
    throw new Error('Usuário não encontrado.');
  }

  usuarios[indiceUsuario].senhaHash = await gerarHash(novaSenha);
  salvarUsuarios(usuarios);

  salvarVerificacoes(
    verificacoes.filter((item) => item !== verificacao),
  );
}