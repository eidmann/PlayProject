import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The frontend calls the API with relative /api URLs; Vite forwards
    // them to the backend so we avoid CORS entirely in development.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['src/test/setupTests.ts'],
    include: ['**/*.test.{ts,tsx}'],
  },
});
