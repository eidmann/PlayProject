import { afterEach, beforeEach, beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
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

const paginatedEntriesResponseSchema = z.object({
  data: z.array(entryResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

beforeAll(async () => {
  await prisma.$connect();
  await prisma.journalEntry.deleteMany();
}, 30_000);

afterEach(async () => {
  vi.restoreAllMocks();
  await prisma.journalEntry.deleteMany();
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

describe('GET /api/entries', () => {
  beforeEach(async () => {
    await Promise.all([
      prisma.journalEntry.create({
        data: {
          title: 'Oldest',
          content: 'First Entry',
          createdAt: new Date('2026-01-01T10:00:00.000Z'),
        },
      }),
      prisma.journalEntry.create({
        data: {
          title: 'Middle',
          content: 'Second Entry',
          createdAt: new Date('2026-01-02T10:00:00.000Z'),
        },
      }),
      prisma.journalEntry.create({
        data: {
          title: 'Newest',
          content: 'Third Entry',
          createdAt: new Date('2026-01-03T10:00:00.000Z'),
        },
      }),
    ]);
  });

  it('returns 200 OK and the entries from the DB if they exist', async () => {
    const response = await request(createApp()).get('/api/entries');
    expect(response.status).toBe(200);
    const parsedResponse = paginatedEntriesResponseSchema.parse(response.body);
    expect(parsedResponse.data).toHaveLength(3);
    expect(parsedResponse.data.map((entry) => entry.title)).toEqual(['Newest', 'Middle', 'Oldest']);
    expect(parsedResponse.pagination.page).toBe(1);
    expect(parsedResponse.pagination.limit).toBe(10);
    expect(parsedResponse.pagination.total).toBe(3);
    expect(parsedResponse.pagination.totalPages).toBe(1);
  });

  it('returns 200 OK and the second page when limit is 2', async () => {
    const response = await request(createApp()).get('/api/entries?page=2&limit=2');
    expect(response.status).toBe(200);
    const parsedResponse = paginatedEntriesResponseSchema.parse(response.body);
    expect(parsedResponse.data).toHaveLength(1);
    expect(parsedResponse.data.map((entry) => entry.title)).toEqual(['Oldest']);
    expect(parsedResponse.pagination.page).toBe(2);
    expect(parsedResponse.pagination.limit).toBe(2);
    expect(parsedResponse.pagination.total).toBe(3);
    expect(parsedResponse.pagination.totalPages).toBe(2);
  });

  it('returns 200 OK and empty array if the page is greater than the total pages', async () => {
    const response = await request(createApp()).get('/api/entries?page=20&limit=2');
    expect(response.status).toBe(200);
    const parsedResponse = paginatedEntriesResponseSchema.parse(response.body);
    expect(parsedResponse.data).toHaveLength(0);
    expect(parsedResponse.pagination.page).toBe(20);
    expect(parsedResponse.pagination.limit).toBe(2);
    expect(parsedResponse.pagination.total).toBe(3);
    expect(parsedResponse.pagination.totalPages).toBe(2);
  });

  it('returns 400 bad request if page is less than 1', async () => {
    const response = await request(createApp()).get('/api/entries?page=0&limit=2');
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid query parameters',
    });
  });

  it('returns 400 bad request if page is not a number', async () => {
    const response = await request(createApp()).get('/api/entries?page=abc&limit=2');
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid query parameters',
    });
  });

  it('returns 400 bad request if limit is not a number', async () => {
    const response = await request(createApp()).get('/api/entries?page=1&limit=abc');
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid query parameters',
    });
  });

  it('returns 400 bad request if limit is less than 1', async () => {
    const response = await request(createApp()).get('/api/entries?page=1&limit=0');
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid query parameters',
    });
  });

  it('returns 400 bad request if limit is greater than 100', async () => {
    const response = await request(createApp()).get('/api/entries?page=1&limit=101');
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid query parameters',
    });
  });

  it('returns 400 bad request if page is not an integer', async () => {
    const response = await request(createApp()).get('/api/entries?page=1.5&limit=2');
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid query parameters',
    });
  });

  it('returns 400 bad request if limit is not an integer', async () => {
    const response = await request(createApp()).get('/api/entries?page=1&limit=2.5');
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid query parameters',
    });
  });

  it('returns empty list when no entries exist', async () => {
    await prisma.journalEntry.deleteMany();
    const response = await request(createApp()).get('/api/entries?page=1&limit=10');
    expect(response.status).toBe(200);
    const parsedResponse = paginatedEntriesResponseSchema.parse(response.body);
    expect(parsedResponse.data).toHaveLength(0);
    expect(parsedResponse.pagination.page).toBe(1);
    expect(parsedResponse.pagination.limit).toBe(10);
    expect(parsedResponse.pagination.total).toBe(0);
    expect(parsedResponse.pagination.totalPages).toBe(0);
  });
});
