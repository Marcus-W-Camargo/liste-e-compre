import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const logoNovo = fileURLToPath(new URL('./src/assets/liste-&-compre.png', import.meta.url));
const backgroundNovo = fileURLToPath(new URL('./src/assets/background.png', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (
    Object.keys(env).some((key) => /PRIVATE|SECRET|TOKEN/.test(key)) ||
    (env.VITE_SUPABASE_PUBLISHABLE_KEY &&
      !env.VITE_SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_'))
  ) {
    throw new Error(
      'Credencial privada em variável VITE_ ou chave pública inválida. Confira .env.example; não coloque segredos no frontend.',
    );
  }
  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: /^.*\/assets\/titulo\.png$/, replacement: logoNovo },
        { find: /^.*\/assets\/background\.(?:jpg|jpeg)$/, replacement: backgroundNovo },
      ],
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: { '/api': 'http://127.0.0.1:3001' },
      hmr: {
        host: '127.0.0.1',
        clientPort: 5173,
      },
    },
  };
});
