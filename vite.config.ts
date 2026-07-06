import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  envPrefix: ['VITE_', 'GEMINI_'],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
