import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'zendia-v2-5.onrender.com'
    ],
  },

  preview: {
    host: '0.0.0.0',
    allowedHosts: [
      'zendia-v2-5.onrender.com'
    ],
  },

  plugins: [react()],

  envPrefix: ['VITE_', 'GEMINI_'],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
