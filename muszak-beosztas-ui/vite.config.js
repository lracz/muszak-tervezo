import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy beállítás – a /api kérések a .NET backend-re irányítódnak
    proxy: {
      '/api': {
        target: 'http://localhost:5148',
        changeOrigin: true,
      },
    },
  },
});
