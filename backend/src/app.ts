import express from 'express';

/**
 * App factory: building the app separately from starting the server
 * lets tests exercise the real app without binding a port.
 */
export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
