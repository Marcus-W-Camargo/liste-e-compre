import { CloudStore } from '../../shared/cloud-store.mjs';
import { readLegacy, validData } from '../../shared/data-validation.mjs';
import type { DadosConta } from '../types';
import { obterSupabase } from '../config/supabase';

async function rpc(
  owner: string,
  name: string,
  params: Record<string, unknown> = {},
) {
  const { data } = await obterSupabase().auth.getSession();
  if (!data.session || data.session.user.id !== owner)
    throw new Error('Sua sessão mudou. Entre novamente para continuar.');
  // Capturar o JWT evita usar o token de OUTRA conta se houver logout durante a requisição.
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/${name}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw new Error(
      'Não foi possível sincronizar. Confira a conexão e se os scripts do Supabase foram instalados.',
    );
  return response.json();
}
async function save(
  owner: string,
  revision: number,
  operation: string,
  data: DadosConta,
) {
  if (!validData(data))
    throw new Error(
      'Os dados da lista são inválidos. Sua cópia ainda está neste navegador.',
    );
  return rpc(owner, 'lc_save_data', {
    p_expected_revision: revision,
    p_operation: operation,
    p_data: data,
  });
}
export const cloud = new CloudStore({
  save,
  async load(owner, email) {
    let result = await rpc(owner, 'lc_load_data');
    if (!result || !validData(result.data))
      throw new Error('Não foi possível carregar suas listas.');
    // Nunca importar usuários, senhas, códigos ou flags antigos. Não apagar as cópias locais.
    if (result.revision === 0) {
      const legacy = readLegacy(localStorage, email);
      if (legacy.invalid)
        return {
          ...result,
          notice:
            'Há dados locais incompatíveis. Eles foram preservados, mas não importados automaticamente.',
        };
      if (legacy.data) {
        const written = await save(owner, 0, crypto.randomUUID(), legacy.data);
        result = await rpc(owner, 'lc_load_data');
        return {
          ...result,
          notice: written.ok
            ? 'Suas listas antigas deste navegador foram importadas. As cópias locais foram preservadas.'
            : '',
        };
      }
    }
    return result;
  },
});
