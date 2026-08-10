import { afterEach, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { z } from 'zod';
import { prisma } from './lib/prisma.js';

/**
 * Worked example (mentor-written): a Supertest integration test.
 * It builds the real Express app and makes a real HTTP request against it —
 * no server process, no mocks. Study this pattern before Exercise 1.
 */
const entryResponseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  title: z.string(),
  content: z.string(),
});

describe('GET /api/health', () => {
  it('responds with 200 and status ok', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns 404 for unknown routes', async () => {
    const response = await request(createApp()).get('/api/nope');

    expect(response.status).toBe(404);
  });
});

describe('POST /api/entries', () => {
  const createdEntryIds: string[] = [];

  afterEach(async () => {
    await prisma.journalEntry.deleteMany({
      where: { id: { in: createdEntryIds } },
    });
    createdEntryIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('responds with 201 and the created entry', async () => {
    const response = await request(createApp()).post('/api/entries').send({
      title: 'Test Entry',
      content: 'This is a test entry',
    });

    expect(response.status).toBe(201);

    const entry = entryResponseSchema.parse(response.body);
    createdEntryIds.push(entry.id);

    expect(entry.title).toBe('Test Entry');
    expect(entry.content).toBe('This is a test entry');
  });

  it('returns 400 if the request body is invalid', async () => {
    const response = await request(createApp()).post('/api/entries').send({
      title: '',
      content: '',
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid request body',
    });
  });

  it('does not accept id in the request body', async () => {
    const response = await request(createApp()).post('/api/entries').send({
      id: 'hacker-chosen',
      title: 'Test Entry',
      content: 'This is a test entry',
    });

    expect(response.status).toBe(201);

    const entry = entryResponseSchema.parse(response.body);
    createdEntryIds.push(entry.id);

    expect(entry.title).toBe('Test Entry');
    expect(entry.content).toBe('This is a test entry');
    expect(entry.id).not.toBe('hacker-chosen');
  });
});
