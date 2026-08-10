import { afterEach, afterAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const entryResponseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  title: z.string(),
  content: z.string(),
});

const createdEntryIds: string[] = [];

afterEach(async () => {
  await prisma.journalEntry.deleteMany({
    where: { id: { in: createdEntryIds } },
  });
  createdEntryIds.length = 0;
  vi.restoreAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/entries', () => {
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

describe('GET /api/entries/:id', () => {
  it('returns 200 OK and the entry if it exists in the DB', async () => {
    const createdEntry = await prisma.journalEntry.create({
      data: {
        title: 'Test Entry',
        content: 'Test Content',
      },
    });
    expect(createdEntry.title).toBe('Test Entry');
    expect(createdEntry.content).toBe('Test Content');
    createdEntryIds.push(createdEntry.id);
    const response = await request(createApp()).get(`/api/entries/${createdEntry.id}`);
    expect(response.status).toBe(200);
    const parsedResponse = entryResponseSchema.parse(response.body);
    expect(parsedResponse.id).toBe(createdEntry.id);
    expect(parsedResponse.title).toBe('Test Entry');
    expect(parsedResponse.content).toBe('Test Content');
  });

  it('returns 404 not found in DB', async () => {
    const response = await request(createApp()).get('/api/entries/123');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: 'Entry not found',
    });
  });
});

describe('DELETE /api/entries/:id', () => {
  it('returns 204 no content if the entry is deleted', async () => {
    const createdEntry = await request(createApp()).post('/api/entries').send({
      title: 'Test Entry',
      content: 'Test Content',
    });
    expect(createdEntry.status).toBe(201);
    const entry = entryResponseSchema.parse(createdEntry.body);
    createdEntryIds.push(entry.id);
    const response = await request(createApp()).delete(`/api/entries/${entry.id}`);
    expect(response.status).toBe(204);
    const deletedEntry = await prisma.journalEntry.findUnique({
      where: { id: entry.id },
    });
    expect(deletedEntry).toBeNull();
    const deletedResponse = await request(createApp()).get(`/api/entries/${entry.id}`);
    expect(deletedResponse.status).toBe(404);
    expect(deletedResponse.body).toMatchObject({
      error: 'Entry not found',
    });
  });

  it('returns 404 not found if the entry is not in the DB', async () => {
    const response = await request(createApp()).delete('/api/entries/cmsnjq5dv0001uobwroj7sag3');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: 'Entry not found',
    });
  });
});

describe('error middleware', () => {
  it('returns 500 JSON when an unexpected error occurs', async () => {
    vi.spyOn(prisma.journalEntry, 'findUnique').mockRejectedValueOnce(
      new Error('database exploded'),
    );
    const response = await request(createApp()).get('/api/entries/any-id');
    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      error: 'Internal server error',
    });
  });
});
