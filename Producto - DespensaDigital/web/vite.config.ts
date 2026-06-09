import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // permite acceder desde celular en la misma red
    proxy: {
      // En desarrollo: /api/... → http://localhost:3001/api/...
      // Esto evita CORS y permite que VITE_API_URL quede vacío en .env
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
