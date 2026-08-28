import { useEffect, useRef, useState } from 'react';
import { type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import {
  cancelarTentativa,
  ErroAutenticacao,
  solicitarAuth,
  type Tentativa,
} from '../services/authService';
import { autenticarUsuario } from '../utils/auth';
import { EMAIL_VALIDO, nomeValido } from '../../shared/auth-validation.mjs';
import './Conta.css';

type Modo = 'login' | 'cadastro' | 'recuperacao';
type EtapaRecuperacao = 'email' | 'codigo' | 'senha';

interface Formulario {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

const inicial: Formulario = {
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
};

export function Conta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const modoInicial: Modo =
    searchParams.get('modo') === 'cadastro' ? 'cadastro' : 'login';

  const [modo, setModo] = useState<Modo>(modoInicial);
  const [etapaRecuperacao, setEtapaRecuperacao] =
    useState<EtapaRecuperacao>('email');
  const [formulario, setFormulario] = useState<Formulario>(inicial);
  const [codigo, setCodigo] = useState('');
  const [codigoCadastro, setCodigoCadastro] = useState('');
  const [cadastroConfirmacao, setCadastroConfirmacao] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);
  const [mostrarAvisoSenha, setMostrarAvisoSenha] = useState(false);
  const [mostrarAvisoConfirmacao, setMostrarAvisoConfirmacao] = useState(false);
  const [mostrarAvisoLogin, setMostrarAvisoLogin] = useState(false);
  const [animacaoRequisitos, setAnimacaoRequisitos] = useState(0);
  const [animacaoConfirmacao, setAnimacaoConfirmacao] = useState(0);
  const [senhasVisiveis, setSenhasVisiveis] = useState<Record<string, boolean>>(
    {},
  );

  const referenciasSenha = useRef<Record<string, HTMLInputElement | null>>({});
  const tentativa = useRef<Tentativa | null>(null);
  const geracao = useRef(0);
  const montado = useRef(true);

  function abandonarTentativa() {
    geracao.current++;
    if (tentativa.current) cancelarTentativa(tentativa.current);
    tentativa.current = null;
  }
  function tratarErro(error: unknown, padrao: string) {
    setErro(error instanceof Error ? error.message : padrao);
    if (
      error instanceof ErroAutenticacao &&
      [
        'TENTATIVA_INVALIDA',
        'TENTATIVA_BLOQUEADA',
        'CONTA_EXISTENTE',
        'CADASTRO_FALHOU',
        'RECUPERACAO_FALHOU',
        'CONTA_INEXISTENTE',
      ].includes(error.code)
    ) {
      abandonarTentativa();
      setCadastroConfirmacao(false);
      setEtapaRecuperacao('email');
      setCodigo('');
      setCodigoCadastro('');
    }
  }
  async function iniciarTentativa(
    purpose: 'cadastro' | 'recuperacao',
    email: string,
  ) {
    abandonarTentativa();
    const versao = geracao.current;
    const nova = await solicitarAuth<Tentativa>({
      action: 'start',
      purpose,
      email,
      name: purpose === 'cadastro' ? formulario.nome.normalize('NFC') : '',
    });
    if (!montado.current || versao !== geracao.current) {
      cancelarTentativa(nova);
      return false;
    }
    tentativa.current = nova;
    return true;
  }
  useEffect(() => {
    montado.current = true;
    const sair = () => abandonarTentativa();
    const retornar = () => {
      if (!tentativa.current) {
        setCadastroConfirmacao(false);
        setEtapaRecuperacao('email');
      }
    };
    window.addEventListener('pagehide', sair);
    window.addEventListener('pageshow', retornar);
    return () => {
      montado.current = false;
      sair();
      window.removeEventListener('pagehide', sair);
      window.removeEventListener('pageshow', retornar);
    };
  }, []);

  const cadastro = modo === 'cadastro';
  const recuperacao = modo === 'recuperacao';
  const requisitosSenha = [
    {
      id: 'tamanho',
      texto: 'Pelo menos 6 caracteres',
      valido: formulario.senha.length >= 6,
    },
    {
      id: 'numero',
      texto: 'Pelo menos 1 número',
      valido: /\d/.test(formulario.senha),
    },
    {
      id: 'especial',
      texto: 'Pelo menos um caractere especial',
      valido: /[!@#$%&*/?_-]/.test(formulario.senha),
    },
    {
      id: 'letras',
      texto: 'A senha não pode ser numérica',
      valido: /[a-zA-ZÀ-ÿ]/.test(formulario.senha),
    },
  ];
  const senhaValida = requisitosSenha.every((requisito) => requisito.valido);

  useEffect(() => {
    const novoModo = searchParams.get('modo');

    if (novoModo === 'login' || novoModo === 'cadastro') {
      abandonarTentativa();
      setCadastroConfirmacao(false);
      setEtapaRecuperacao('email');
      setModo(novoModo);
    }
  }, [searchParams]);

  useEffect(() => {
    function sincronizarPreenchimentoAutomatico() {
      const campos = [
        ['usr-senha', 'senha'],
        ['usr-redefined-senha', 'confirmarSenha'],
        ['nova-senha', 'senha'],
        ['repete-nova-senha', 'confirmarSenha'],
      ] as const;

      setFormulario((atual) => {
        let proximo = atual;

        for (const [id, campo] of campos) {
          const input = referenciasSenha.current[id];

          if (input && input.value !== proximo[campo]) {
            proximo = {
              ...proximo,
              [campo]: input.value,
            };
          }
        }

        return proximo;
      });
    }

    const intervalo = window.setInterval(
      sincronizarPreenchimentoAutomatico,
      100,
    );

    document.addEventListener(
      'input',
      sincronizarPreenchimentoAutomatico,
      true,
    );

    window.addEventListener('focus', sincronizarPreenchimentoAutomatico);

    return () => {
      window.clearInterval(intervalo);

      document.removeEventListener(
        'input',
        sincronizarPreenchimentoAutomatico,
        true,
      );

      window.removeEventListener('focus', sincronizarPreenchimentoAutomatico);
    };
  }, []);

  function alterarCampo(campo: keyof Formulario, valor: string) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));

    setErro('');
    setMensagem('');

    if (campo === 'senha') setMostrarAvisoSenha(false);
    if (campo === 'confirmarSenha') setMostrarAvisoConfirmacao(false);
    if (campo === 'senha') setMostrarAvisoLogin(false);
  }

  function alternarSenha(id: string) {
    setSenhasVisiveis((atual) => ({
      ...atual,
      [id]: !atual[id],
    }));
  }

  function campoSenha(
    id: string,
    valor: string,
    onChange: (valor: string) => void,
    autoComplete: string,
  ) {
    const visivel = Boolean(senhasVisiveis[id]);

    const frutas = ['🍎', '🍐', '🍋', '🍇', '🍓', '🍒', '🍑', '🍅', '🍆'];

    return (
      <div
        className="wrapper-senha"
        onMouseDown={() => {
          if (id === 'usr-redefined-senha' || id === 'repete-nova-senha') {
            setMostrarAvisoConfirmacao(false);
          }

          if (id === 'usr-senha') {
            setMostrarAvisoSenha(false);
          }
        }}
      >
        <input
          ref={(input) => {
            referenciasSenha.current[id] = input;
          }}
          id={id}
          className={`input-senha-estilizado ${visivel ? 'senha-visivel' : ''}`}
          type={visivel ? 'text' : 'password'}
          value={valor}
          onInput={(event) => onChange(event.currentTarget.value)}
          onChange={(event) => onChange(event.currentTarget.value)}
          onFocus={() => {
            if (id === 'usr-senha') {
              setMostrarAvisoSenha(false);
              setMostrarAvisoLogin(false);
            }

            if (id === 'usr-redefined-senha' || id === 'repete-nova-senha') {
              setMostrarAvisoConfirmacao(false);
            }
          }}
          autoComplete={autoComplete}
          maxLength={128}
          required
        />

        {!visivel && valor.length > 0 && (
          <div className="espelho-frutas-camada" aria-hidden="true">
            {Array.from(valor, (_, indice) => (
              <span key={`${id}-fruta-${indice}`}>
                {frutas[indice % frutas.length]}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          className="btn-mostrar-senha"
          onClick={() => alternarSenha(id)}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visivel ? '🙈' : '👁️'}
        </button>
      </div>
    );
  }

  function trocarModo(novoModo: Modo) {
    abandonarTentativa();
    setModo(novoModo);
    setEtapaRecuperacao('email');
    setFormulario(inicial);
    setCodigo('');
    setCodigoCadastro('');
    setCadastroConfirmacao(false);
    setSenhasVisiveis({});
    setErro('');
    setMensagem('');
    setMostrarAvisoSenha(false);
    setMostrarAvisoConfirmacao(false);
    setMostrarAvisoLogin(false);
  }

  async function submeter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setMensagem('');
    setMostrarAvisoLogin(false);
    setProcessando(true);

    try {
      const email = formulario.email.trim().toLowerCase();

      if (cadastro && !nomeValido(formulario.nome)) {
        throw new Error(
          'Use Nome e Sobrenome, com um único espaço e até 21 caracteres.',
        );
      }

      if (!EMAIL_VALIDO.test(email)) {
        throw new Error('Informe um e-mail válido.');
      }

      if ((cadastro || recuperacao) && (!formulario.senha || !senhaValida)) {
        setMostrarAvisoSenha(true);
        setAnimacaoRequisitos((atual) => atual + 1);
        return;
      }

      if (cadastro && formulario.senha !== formulario.confirmarSenha) {
        setMostrarAvisoConfirmacao(true);
        setAnimacaoConfirmacao((atual) => atual + 1);
        return;
      }

      if (cadastro) {
        if (!(await iniciarTentativa('cadastro', email))) return;

        setCodigoCadastro('');
        setCadastroConfirmacao(true);
        setMensagem('Código enviado para seu e-mail.');
        return;
      }

      await autenticarUsuario(email, formulario.senha);

      navigate('/');
    } catch (error) {
      if (
        !cadastro &&
        !recuperacao &&
        error instanceof Error &&
        error.message === 'E-mail ou senha inválidos.'
      ) {
        setMostrarAvisoLogin(true);
      }

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a operação.',
      );
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarCadastroFormulario() {
    setErro('');
    setMensagem('');
    setProcessando(true);

    try {
      if (!/^\d{4}$/.test(codigoCadastro)) {
        throw new Error('Informe o código de 4 dígitos.');
      }

      if (!tentativa.current)
        throw new Error('Inicie uma nova tentativa de cadastro.');
      await solicitarAuth({
        action: 'confirm-signup',
        ...tentativa.current,
        email: formulario.email,
        name: formulario.nome.normalize('NFC'),
        password: formulario.senha,
        code: codigoCadastro,
      });
      tentativa.current = null;

      setCadastroConfirmacao(false);
      setCodigoCadastro('');
      setFormulario((atual) => ({
        ...atual,
        senha: '',
        confirmarSenha: '',
      }));
      setModo('login');
      setMensagem('Cadastro confirmado. Faça login para continuar.');
    } catch (error) {
      tratarErro(error, 'Código de confirmação inválido.');
    } finally {
      setProcessando(false);
    }
  }

  function alterarDigitoCadastro(indice: number, valor: string) {
    const digito = valor.replace(/\D/g, '').slice(-1);
    const codigoAtualizado = codigoCadastro.padEnd(4, ' ').split('');

    codigoAtualizado[indice] = digito;
    setCodigoCadastro(codigoAtualizado.join('').trimEnd());

    if (digito && indice < 3) {
      document.getElementById(`codigo-cadastro-${indice + 2}`)?.focus();
    }
  }

  function colarCodigoCadastro(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const codigoColado = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 4);

    setCodigoCadastro(codigoColado);

    const indiceFoco = Math.min(codigoColado.length, 3) + 1;
    document.getElementById(`codigo-cadastro-${indiceFoco}`)?.focus();
  }

  function tratarBackspaceCadastro(
    event: React.KeyboardEvent<HTMLInputElement>,
    indice: number,
  ) {
    if (event.key !== 'Backspace' || indice === 0) return;

    const valorAtual = codigoCadastro[indice] ?? '';

    if (!valorAtual.trim()) {
      const codigoAtualizado = codigoCadastro.padEnd(4, ' ').split('');
      codigoAtualizado[indice - 1] = '';
      setCodigoCadastro(codigoAtualizado.join('').trimEnd());
      document.getElementById(`codigo-cadastro-${indice}`)?.focus();
    }
  }

  async function avancarRecuperacao() {
    setErro('');
    setMensagem('');
    setProcessando(true);

    try {
      if (etapaRecuperacao === 'email') {
        const email = formulario.email.trim().toLowerCase();

        if (!EMAIL_VALIDO.test(email)) {
          throw new Error('Informe um e-mail válido.');
        }

        if (!(await iniciarTentativa('recuperacao', email))) return;

        setEtapaRecuperacao('codigo');
        setMensagem('Código enviado para seu e-mail.');
        return;
      }

      if (etapaRecuperacao === 'codigo') {
        if (!/^\d{4}$/.test(codigo)) {
          throw new Error('Informe o código de 4 dígitos.');
        }

        if (!tentativa.current)
          throw new Error('Inicie uma nova tentativa de recuperação.');
        const versao = geracao.current;
        const autorizacao = await solicitarAuth<Tentativa>({
          action: 'verify-recovery',
          ...tentativa.current,
          email: formulario.email,
          code: codigo,
        });
        if (!montado.current || versao !== geracao.current) {
          cancelarTentativa(autorizacao);
          return;
        }
        tentativa.current = autorizacao;
        setEtapaRecuperacao('senha');
        setCodigo('');
        setMensagem('Código confirmado. Defina sua nova senha.');
        return;
      }

      if (!senhaValida) {
        setMostrarAvisoSenha(true);
        setAnimacaoRequisitos((atual) => atual + 1);
        return;
      }

      if (formulario.senha !== formulario.confirmarSenha) {
        setMostrarAvisoConfirmacao(true);
        setAnimacaoConfirmacao((atual) => atual + 1);
        return;
      }

      if (!tentativa.current)
        throw new Error('Confirme o código antes de redefinir a senha.');
      await solicitarAuth({
        action: 'reset-password',
        ...tentativa.current,
        email: formulario.email,
        password: formulario.senha,
      });
      tentativa.current = null;

      setModo('login');
      setEtapaRecuperacao('email');
      setCodigo('');
      setFormulario(inicial);
      setSenhasVisiveis({});
      setMensagem('Senha redefinida com sucesso.');
    } catch (error) {
      tratarErro(error, 'Não foi possível concluir a recuperação.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <main className="container-autenticacao">
      <Link
        to="/"
        className="botao-voltar-seta"
        aria-label="Voltar para a página inicial"
      >
        ←
      </Link>

      {!recuperacao && (
        <section
          className={`card-formulario ${
            cadastroConfirmacao ? 'card-confirmacao-cadastro' : ''
          }`}
        >
          {!cadastroConfirmacao && (
            <div className="abas-formulario">
              <button
                type="button"
                className={`aba-item ${modo === 'login' ? 'ativa' : ''}`}
                onClick={() => trocarModo('login')}
                disabled={processando}
              >
                Entrar
              </button>

              <button
                type="button"
                className={`aba-item ${cadastro ? 'ativa' : ''}`}
                onClick={() => trocarModo('cadastro')}
                disabled={processando}
              >
                Cadastrar
              </button>
            </div>
          )}

          {cadastro && cadastroConfirmacao ? (
            <div className="form-conteudo">
              <div className="cabecalho-verificacao">
                <h2>Verifique seu e-mail</h2>
                <p>
                  O seu código de verificação foi enviado para o E-mail:{' '}
                  <strong className="email-confirmacao">
                    {formulario.email}
                  </strong>
                  .
                </p>
                <p className="dica-verificacao">
                  💡 Dica: Caso não encontre na caixa de entrada, verifique sua
                  pasta de Spam ou Lixo Eletrônico.
                </p>
                <p className="correcao-email">
                  Caso esteja incorreto,{' '}
                  <button
                    type="button"
                    className="link-corrigir"
                    onClick={() => {
                      abandonarTentativa();
                      setCadastroConfirmacao(false);
                      setCodigoCadastro('');
                      setErro('');
                    }}
                    disabled={processando}
                  >
                    clique aqui
                  </button>{' '}
                  para corrigir.
                </p>
              </div>

              <div className="grupo-campo">
                <div className="container-quadradinhos">
                  {[0, 1, 2, 3].map((indice) => (
                    <input
                      key={`codigo-cadastro-${indice}`}
                      id={`codigo-cadastro-${indice + 1}`}
                      className="input-codigo"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={codigoCadastro[indice] ?? ''}
                      onChange={(event) =>
                        alterarDigitoCadastro(indice, event.currentTarget.value)
                      }
                      onPaste={colarCodigoCadastro}
                      onKeyDown={(event) =>
                        tratarBackspaceCadastro(event, indice)
                      }
                      autoComplete={indice === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Dígito ${indice + 1} do código`}
                    />
                  ))}
                </div>
              </div>

              {erro && <span className="texto-erro-senha">{erro}</span>}

              <button
                type="button"
                className="botao-enviar"
                onClick={confirmarCadastroFormulario}
                disabled={processando}
              >
                {processando ? 'Confirmando...' : 'Confirmar Código'}
              </button>
            </div>
          ) : (
            <form
              className={`form-conteudo ${
                cadastro ? 'form-cadastro' : 'form-login'
              }`}
              onSubmit={submeter}
            >
              {cadastro && (
                <div className="grupo-campo">
                  <label htmlFor="usr-nome">Nome e Sobrenome</label>

                  <input
                    id="usr-nome"
                    type="text"
                    value={formulario.nome}
                    onChange={(event) =>
                      alterarCampo('nome', event.target.value)
                    }
                    autoComplete="name"
                    maxLength={21}
                    aria-describedby="nome-regra"
                    required
                  />
                  <small id="nome-regra">
                    Até 21 caracteres, com apenas um espaço. Ex.: Maria Silva.
                  </small>
                </div>
              )}

              <div className="grupo-campo">
                <label htmlFor="usr-email">E-mail</label>

                <input
                  id="usr-email"
                  type="email"
                  value={formulario.email}
                  onChange={(event) =>
                    alterarCampo('email', event.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>

              <div className="grupo-campo">
                <label htmlFor="usr-senha">Senha</label>

                {campoSenha(
                  'usr-senha',
                  formulario.senha,
                  (valor) => alterarCampo('senha', valor),
                  cadastro ? 'new-password' : 'current-password',
                )}

                {cadastro && (
                  <>
                    <div key={animacaoRequisitos} className="requisitos-lista">
                      {requisitosSenha.map((requisito) => (
                        <p
                          key={requisito.id}
                          className={`req-item ${
                            requisito.valido ? 'valido' : ''
                          } ${
                            mostrarAvisoSenha && !requisito.valido
                              ? 'balancar-erro'
                              : ''
                          }`}
                        >
                          • {requisito.texto}
                        </p>
                      ))}
                    </div>

                    {mostrarAvisoSenha && (
                      <div className="balao-notificacao-esquerda-pura balao-senha">
                        <span className="triangulo-alerta-laranja">⚠️</span>
                        <div className="setinha-balao-esquerda" />
                      </div>
                    )}
                  </>
                )}

                {!cadastro && (
                  <>
                    <button
                      type="button"
                      className="link-corrigir"
                      onClick={() => trocarModo('recuperacao')}
                      disabled={processando}
                    >
                      Esqueci minha senha
                    </button>

                    {mostrarAvisoLogin && (
                      <span className="texto-erro-login">
                        E-mail ou senha inválidos.
                        <br />
                        Verifique seus dados novamente.
                      </span>
                    )}
                  </>
                )}
              </div>

              {cadastro && (
                <div className="grupo-campo">
                  <label htmlFor="usr-redefined-senha">Repita sua senha</label>

                  {campoSenha(
                    'usr-redefined-senha',
                    formulario.confirmarSenha,
                    (valor) => alterarCampo('confirmarSenha', valor),
                    'new-password',
                  )}

                  {mostrarAvisoConfirmacao && (
                    <div
                      key={animacaoConfirmacao}
                      className="balao-notificacao-esquerda-pura balao-confirmacao"
                    >
                      <span className="triangulo-alerta-laranja">⚠️</span>
                      <div className="setinha-balao-esquerda" />
                    </div>
                  )}

                  {formulario.confirmarSenha &&
                    formulario.senha !== formulario.confirmarSenha && (
                      <span
                        key={animacaoConfirmacao}
                        className={`texto-erro-senha ${
                          mostrarAvisoConfirmacao ? 'balancar-erro' : ''
                        }`}
                      >
                        As senhas não coincidem.
                      </span>
                    )}
                </div>
              )}

              {erro && !mostrarAvisoLogin && (
                <span className="texto-erro-senha">{erro}</span>
              )}

              {mensagem && <span className="texto-sucesso">{mensagem}</span>}

              <button
                type="submit"
                className="botao-enviar"
                disabled={processando}
              >
                {processando ? 'Aguarde...' : cadastro ? 'Cadastrar' : 'Entrar'}
              </button>
            </form>
          )}
        </section>
      )}

      {recuperacao && (
        <section className="card-formulario">
          <div className="cabecalho-verificacao">
            <h2>Recuperar senha</h2>

            <p>
              {etapaRecuperacao === 'email'
                ? 'Insira o e-mail da sua conta.'
                : etapaRecuperacao === 'codigo'
                  ? 'Digite o código enviado para seu e-mail.'
                  : 'Defina sua nova senha.'}
            </p>
          </div>

          <div className="form-conteudo">
            {etapaRecuperacao === 'email' && (
              <div className="grupo-campo">
                <label htmlFor="rec-email">E-mail cadastrado</label>

                <input
                  id="rec-email"
                  type="email"
                  value={formulario.email}
                  onChange={(event) =>
                    alterarCampo('email', event.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>
            )}

            {etapaRecuperacao === 'codigo' && (
              <div className="grupo-campo">
                <label htmlFor="codigo-recuperacao">Código</label>

                <input
                  id="codigo-recuperacao"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={codigo}
                  onChange={(event) =>
                    setCodigo(event.target.value.replace(/\D/g, ''))
                  }
                  autoComplete="one-time-code"
                  required
                />
              </div>
            )}

            {etapaRecuperacao === 'senha' && (
              <>
                <div className="grupo-campo">
                  <label htmlFor="nova-senha">Nova senha</label>

                  {campoSenha(
                    'nova-senha',
                    formulario.senha,
                    (valor) => alterarCampo('senha', valor),
                    'new-password',
                  )}

                  <div key={animacaoRequisitos} className="requisitos-lista">
                    {requisitosSenha.map((requisito) => (
                      <p
                        key={requisito.id}
                        className={`req-item ${
                          requisito.valido ? 'valido' : ''
                        } ${
                          mostrarAvisoSenha && !requisito.valido
                            ? 'balancar-erro'
                            : ''
                        }`}
                      >
                        • {requisito.texto}
                      </p>
                    ))}
                  </div>

                  {mostrarAvisoSenha && (
                    <div className="balao-notificacao-esquerda-pura balao-senha">
                      <span className="triangulo-alerta-laranja">⚠️</span>
                      <div className="setinha-balao-esquerda" />
                    </div>
                  )}
                </div>

                <div className="grupo-campo">
                  <label htmlFor="repete-nova-senha">Repita a nova senha</label>

                  {campoSenha(
                    'repete-nova-senha',
                    formulario.confirmarSenha,
                    (valor) => alterarCampo('confirmarSenha', valor),
                    'new-password',
                  )}

                  {mostrarAvisoConfirmacao && (
                    <div
                      key={animacaoConfirmacao}
                      className="balao-notificacao-esquerda-pura balao-confirmacao"
                    >
                      <span className="triangulo-alerta-laranja">⚠️</span>
                      <div className="setinha-balao-esquerda" />
                    </div>
                  )}

                  {formulario.confirmarSenha &&
                    formulario.senha !== formulario.confirmarSenha && (
                      <span
                        key={animacaoConfirmacao}
                        className={`texto-erro-senha ${
                          mostrarAvisoConfirmacao ? 'balancar-erro' : ''
                        }`}
                      >
                        As senhas não coincidem.
                      </span>
                    )}
                </div>
              </>
            )}

            {erro && <span className="texto-erro-senha">{erro}</span>}

            {mensagem && <span className="texto-sucesso">{mensagem}</span>}

            <button
              type="button"
              className="botao-enviar"
              onClick={avancarRecuperacao}
              disabled={processando}
            >
              {processando
                ? 'Aguarde...'
                : etapaRecuperacao === 'email'
                  ? 'Enviar código'
                  : etapaRecuperacao === 'codigo'
                    ? 'Confirmar código'
                    : 'Redefinir senha'}
            </button>

            <button
              type="button"
              className="link-corrigir"
              onClick={() => trocarModo('login')}
              disabled={processando}
            >
              Voltar para o login
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
