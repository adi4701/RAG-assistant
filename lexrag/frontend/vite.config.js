import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/lexrag-app/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/auth':      { target: 'http://localhost:8000', changeOrigin: true },
      '/documents': { target: 'http://localhost:8000', changeOrigin: true },
      '/query':     { target: 'http://localhost:8000', changeOrigin: true },
      '/health':    { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  optimizeDeps: {
    include: ['gsap', 'gsap/ScrollTrigger', 'framer-motion'],
  },
});
