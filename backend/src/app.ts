import express from 'express';
import {
  createJournalEntrySchema,
  listMoodsQuerySchema,
  paginationSchema,
  updateJournalEntrySchema,
} from './schemas/journalEntrySchemas.js';
import { prisma } from './lib/prisma.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js';

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

    const { title, content, mood } = result.data;

    const createdEntry = await prisma.journalEntry.create({
      data: { title, content, mood: mood ?? null },
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

  app.put('/api/entries/:id', async (req, res) => {
    const result = updateJournalEntrySchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request body', fields: result.error.flatten().fieldErrors });
    }
    const { title, content, mood } = result.data;
    try {
      const updatedEntry = await prisma.journalEntry.update({
        where: { id: req.params.id },
        data: { title, content, mood: mood ?? null },
      });
      return res.status(200).json(updatedEntry);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Entry not found' });
      }
      throw error;
    }
  });

  app.delete('/api/entries/:id', async (req, res) => {
    try {
      await prisma.journalEntry.delete({ where: { id: req.params.id } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Entry not found' });
      }
      throw error;
    }

    return res.status(204).send();
  });

  app.get('/api/moods', async (req, res) => {
    const result = listMoodsQuerySchema.safeParse(req.query);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: 'Invalid query parameters', fields: result.error.flatten().fieldErrors });
    }
    const { from, to } = result.data;

    const entries = await prisma.journalEntry.findMany({
      where: {
        mood: { not: null },
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      select: { id: true, createdAt: true, mood: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const data = entries
      .filter((entry) => entry.mood !== null)
      .map((entry) => ({
        id: entry.id,
        createdAt: entry.createdAt,
        mood: entry.mood,
      }));
    return res.status(200).json({ data });
  });

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    },
  );

  return app;
}
