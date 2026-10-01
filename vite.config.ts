import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Served from https://<user>.github.io/<repo>/ on GitHub Pages; "/" elsewhere.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
});
