import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo (npm run dev) las llamadas a /api se redirigen a la API local.
// En Docker el proxy lo hace nginx, y en AWS lo hace CloudFront.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
