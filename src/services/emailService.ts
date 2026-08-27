import emailjs from '@emailjs/browser';
import {
  EMAILJS_CONFIG,
  validarConfiguracaoEmail,
} from '../config/emailjs';

interface ParametrosCodigo {
  email: string;
  nome: string;
  codigo: string;
}

function verificarConfiguracao(): void {
  if (!validarConfiguracaoEmail()) {
    throw new Error(
      'Configuração do EmailJS incompleta. Verifique o arquivo .env.local.',
    );
  }

  emailjs.init({
    publicKey: EMAILJS_CONFIG.publicKey,
  });
}

export async function enviarCodigoCadastro({
  email,
  nome,
  codigo,
}: ParametrosCodigo): Promise<void> {
  verificarConfiguracao();

  await emailjs.send(
    EMAILJS_CONFIG.serviceId,
    EMAILJS_CONFIG.templateCadastroId,
    {
      to_email: email,
      nome,
      codigo,
    },
  );
}

export async function enviarCodigoRecuperacao({
  email,
  nome,
  codigo,
}: ParametrosCodigo): Promise<void> {
  verificarConfiguracao();

  await emailjs.send(
    EMAILJS_CONFIG.serviceId,
    EMAILJS_CONFIG.templateRecuperacaoId,
    {
      to_email: email,
      nome,
      codigo,
      recuperar: codigo,
    },
  );
}