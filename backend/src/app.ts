import express from 'express';
import { createJournalEntrySchema, paginationSchema } from './schemas/journalEntrySchemas.js';
import { prisma } from './lib/prisma.js';
import { Prisma } from '@prisma/client';

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
  app.get('/api/entries', async (req, res) => {
    const result = paginationSchema.safeParse(req.query);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: 'Invalid query parameters', fields: result.error.flatten().fieldErrors });
    }
    const { page, limit } = result.data;
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      prisma.journalEntry.count(),
    ]);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return res.status(200).json({
      data: entries,
      pagination: { page, limit, total, totalPages },
    });
  });

  app.get('/api/entries/:id', async (req, res) => {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: req.params.id },
    });
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    return res.status(200).json(entry);
  });

  app.delete('/api/entries/:id', async (req, res) => {
    try {
      await prisma.journalEntry.delete({ where: { id: req.params.id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Entry not found' });
      }
      throw error;
    }

    return res.status(204).send();
  });

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    },
  );

  return app;
}
