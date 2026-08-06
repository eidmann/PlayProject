import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // The frontend calls the API with relative /api URLs; Vite forwards
    // them to the backend so we avoid CORS entirely in development.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['src/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
