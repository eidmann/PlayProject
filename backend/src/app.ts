import express from 'express';
import { createJournalEntrySchema } from './schemas/journalEntrySchemas.js';
import { prisma } from './lib/prisma.js';

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

  app.post('/api/entries', async (req, res) => {
    const result = createJournalEntrySchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request body', fields: result.error.flatten().fieldErrors });
    }

    const createdEntry = await prisma.journalEntry.create({
      data: result.data,
    });

    return res.status(201).json(createdEntry);
  });

  app.delete('/api/entries/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.journalEntry.delete({
      where: { id },
    });
    return res.status(204).send();
  });

  return app;
}
