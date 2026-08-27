export const EMAILJS_CONFIG = {
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateCadastroId: import.meta.env.VITE_EMAILJS_TEMPLATE_CADASTRO_ID,
  templateRecuperacaoId:
    import.meta.env.VITE_EMAILJS_TEMPLATE_RECUPERACAO_ID,
} as const;

export function validarConfiguracaoEmail(): boolean {
  return Object.values(EMAILJS_CONFIG).every(
    (valor) => typeof valor === 'string' && valor.trim().length > 0,
  );
}