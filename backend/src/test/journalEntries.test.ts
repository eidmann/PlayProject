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
  mood: z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD']).nullable(),
});

const moodResponseSchema = z
  .object({
    id: z.string(),
    createdAt: z.string(),
    mood: z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD']),
  })
  .strict();

const listMoodsResponseSchema = z.object({
  data: z.array(moodResponseSchema),
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
      mood: 'GOOD',
    });

    expect(response.status).toBe(201);

    const entry = entryResponseSchema.parse(response.body);

    expect(entry.title).toBe('Test Entry');
    expect(entry.content).toBe('This is a test entry');
    expect(entry.mood).toBe('GOOD');
  });

  it('responds with 201 and the created entry with no mood', async () => {
    const response = await request(createApp()).post('/api/entries').send({
      title: 'Test Entry',
      content: 'This is a test entry',
    });

    expect(response.status).toBe(201);

    const entry = entryResponseSchema.parse(response.body);

    expect(entry.title).toBe('Test Entry');
    expect(entry.content).toBe('This is a test entry');
    expect(entry.mood).toBeNull();
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

  it('returns 400 if the request mood is not a valid mood', async () => {
    const response = await request(createApp()).post('/api/entries').send({
      title: 'Test Entry',
      content: 'This is a test entry',
      mood: 'ecstatic',
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid request body',
    });
  });

  it('returns 400 if the request mood is number', async () => {
    const response = await request(createApp()).post('/api/entries').send({
      title: 'Test Entry',
      content: 'This is a test entry',
      mood: 3,
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
    const createdEntry = await request(createApp()).post('/api/entries').send({
      title: 'Test Entry',
      content: 'This is a test entry',
      mood: 'GOOD',
    });
    expect(createdEntry.status).toBe(201);
    const parsedEntry = entryResponseSchema.parse(createdEntry.body);
    const response = await request(createApp()).get(`/api/entries/${parsedEntry.id}`);
    expect(response.status).toBe(200);
    const parsedResponse = entryResponseSchema.parse(response.body);
    expect(parsedResponse.id).toBe(parsedEntry.id);
    expect(parsedResponse.title).toBe('Test Entry');
    expect(parsedResponse.content).toBe('This is a test entry');
    expect(parsedResponse.mood).toBe('GOOD');
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

describe('PUT /api/entries/:id', () => {
  it('returns 200 OK and the updated entry if successful', async () => {
    const createdEntry = await request(createApp()).post('/api/entries').send({
      title: 'Test Entry',
      content: 'Test Content',
      mood: 'GREAT',
    });
    expect(createdEntry.status).toBe(201);
    const parsedEntry = entryResponseSchema.parse(createdEntry.body);
    const response = await request(createApp()).put(`/api/entries/${parsedEntry.id}`).send({
      title: 'Updated Title',
      content: 'Updated Content',
      mood: null,
    });
    expect(response.status).toBe(200);
    const parsedResponse = entryResponseSchema.parse(response.body);
    expect(parsedResponse.title).toBe('Updated Title');
    expect(parsedResponse.content).toBe('Updated Content');
    expect(parsedResponse.mood).toBeNull();
    expect(parsedResponse.id).toBe(parsedEntry.id);
    expect(new Date(parsedResponse.updatedAt).getTime()).toBeGreaterThan(
      new Date(parsedEntry.updatedAt).getTime(),
    );
  });

  it('updates mood to null if not provided', async () => {
    const createdEntry = await request(createApp()).post('/api/entries').send({
      title: 'Test Entry',
      content: 'Test Content',
      mood: 'GREAT',
    });
    expect(createdEntry.status).toBe(201);
    const parsedEntry = entryResponseSchema.parse(createdEntry.body);
    const response = await request(createApp()).put(`/api/entries/${parsedEntry.id}`).send({
      title: 'Updated Title',
      content: 'Updated Content',
    });
    expect(response.status).toBe(200);
    const parsedResponse = entryResponseSchema.parse(response.body);
    expect(parsedResponse.mood).toBeNull();
  });

  it('updates mood to new value if provided', async () => {
    const createdEntry = await request(createApp()).post('/api/entries').send({
      title: 'Test Entry',
      content: 'Test Content',
      mood: 'GREAT',
    });
    expect(createdEntry.status).toBe(201);
    const parsedEntry = entryResponseSchema.parse(createdEntry.body);
    const response = await request(createApp()).put(`/api/entries/${parsedEntry.id}`).send({
      title: 'Updated Title',
      content: 'Updated Content',
      mood: 'GOOD',
    });
    expect(response.status).toBe(200);
    const parsedResponse = entryResponseSchema.parse(response.body);
    expect(parsedResponse.mood).toBe('GOOD');
  });

  it('returns 404 not found if the ID is not found in the DB', async () => {
    const response = await request(createApp()).put('/api/entries/123').send({
      title: 'Update Title',
      content: 'Update Content',
    });
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: 'Entry not found',
    });
  });

  it('returns 400 bad request if the request body is invalid', async () => {
    const response = await request(createApp()).put('/api/entries/123').send({
      title: '',
      content: '',
    });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid request body',
    });
  });

  it('returns 400 bad request if the request mood is number', async () => {
    const response = await request(createApp()).put('/api/entries/123').send({
      title: 'Test Entry',
      content: 'Test Content',
      mood: 3,
    });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid request body',
    });
  });

  it('returns 400 bad request if the request mood is not a valid mood', async () => {
    const response = await request(createApp()).put('/api/entries/123').send({
      title: 'Test Entry',
      content: 'Test Content',
      mood: 'ecstatic',
    });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid request body',
    });
  });

  it('returns 200 OK and the original ID if trying to update the ID', async () => {
    const createdEntry = await request(createApp()).post('/api/entries').send({
      title: 'Test Entry',
      content: 'Test Content',
    });
    expect(createdEntry.status).toBe(201);
    const parsedEntry = entryResponseSchema.parse(createdEntry.body);
    const response = await request(createApp()).put(`/api/entries/${parsedEntry.id}`).send({
      id: 'hacker-chosen',
      title: 'Updated Title',
      content: 'Updated Content',
    });
    expect(response.status).toBe(200);
    const parsedResponse = entryResponseSchema.parse(response.body);
    expect(parsedResponse.id).toBe(parsedEntry.id);
    expect(parsedResponse.title).toBe('Updated Title');
    expect(parsedResponse.content).toBe('Updated Content');
    expect(new Date(parsedResponse.updatedAt).getTime()).toBeGreaterThan(
      new Date(parsedEntry.updatedAt).getTime(),
    );
  });
});

describe('GET /api/moods', () => {
  beforeEach(async () => {
    await Promise.all([
      prisma.journalEntry.create({
        data: {
          title: 'Oldest',
          content: 'First Entry',
          mood: 'GREAT',
          createdAt: new Date('2026-01-01T10:00:00.000Z'),
        },
      }),
      prisma.journalEntry.create({
        data: {
          title: 'Middle',
          content: 'Second Entry',
          mood: 'GOOD',
          createdAt: new Date('2026-01-02T10:00:00.000Z'),
        },
      }),
      prisma.journalEntry.create({
        data: {
          title: 'Second Newest',
          content: 'Third Entry',
          mood: null,
          createdAt: new Date('2026-01-03T10:00:00.000Z'),
        },
      }),
      prisma.journalEntry.create({
        data: {
          title: 'Newest',
          content: 'Fourth Entry',
          mood: 'BAD',
          createdAt: new Date('2026-01-04T10:00:00.000Z'),
        },
      }),
    ]);
  });

  it('returns 200 ok and the moods if they exist', async () => {
    const response = await request(createApp()).get('/api/moods');
    expect(response.status).toBe(200);
    const parsedResponse = listMoodsResponseSchema.parse(response.body);
    expect(parsedResponse.data).toHaveLength(3);
    expect(parsedResponse.data.map((entry) => entry.mood)).toEqual(['GREAT', 'GOOD', 'BAD']);
  });

  it('returns moods between from and to dates if provided', async () => {
    const response = await request(createApp()).get(
      '/api/moods?from=2026-01-01T10:00:00.000Z&to=2026-01-02T10:00:00.000Z',
    );
    expect(response.status).toBe(200);
    const parsedResponse = listMoodsResponseSchema.parse(response.body);
    expect(parsedResponse.data).toHaveLength(2);
    expect(parsedResponse.data.map((entry) => entry.createdAt)).toEqual([
      '2026-01-01T10:00:00.000Z',
      '2026-01-02T10:00:00.000Z',
    ]);
    expect(parsedResponse.data.map((entry) => entry.mood)).toEqual(['GREAT', 'GOOD']);
  });

  it('returns moods from start date if only from is provided', async () => {
    const response = await request(createApp()).get('/api/moods?from=2026-01-01T10:00:00.000Z');
    expect(response.status).toBe(200);
    const parsedResponse = listMoodsResponseSchema.parse(response.body);
    expect(parsedResponse.data).toHaveLength(3);
    expect(parsedResponse.data.map((entry) => entry.createdAt)).toEqual([
      '2026-01-01T10:00:00.000Z',
      '2026-01-02T10:00:00.000Z',
      '2026-01-04T10:00:00.000Z',
    ]);
    expect(parsedResponse.data.map((entry) => entry.mood)).toEqual(['GREAT', 'GOOD', 'BAD']);
  });

  it('returns moods to end date if only to is provided', async () => {
    const response = await request(createApp()).get('/api/moods?to=2026-01-02T10:00:00.000Z');
    expect(response.status).toBe(200);
    const parsedResponse = listMoodsResponseSchema.parse(response.body);
    expect(parsedResponse.data).toHaveLength(2);
    expect(parsedResponse.data.map((entry) => entry.createdAt)).toEqual([
      '2026-01-01T10:00:00.000Z',
      '2026-01-02T10:00:00.000Z',
    ]);
    expect(parsedResponse.data.map((entry) => entry.mood)).toEqual(['GREAT', 'GOOD']);
  });

  it('returns 400 bad request if from is not a valid date', async () => {
    const response = await request(createApp()).get(
      '/api/moods?from=abc&to=2026-01-02T10:00:00.000Z',
    );
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid query parameters',
    });
  });

  it('returns 400 bad request if to is not a valid date', async () => {
    const response = await request(createApp()).get(
      '/api/moods?from=2026-01-01T10:00:00.000Z&to=abc',
    );
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid query parameters',
    });
  });

  it('returns 400 bad request if from is greater than to', async () => {
    const response = await request(createApp()).get(
      '/api/moods?from=2026-01-02T10:00:00.000Z&to=2026-01-01T10:00:00.000Z',
    );
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid query parameters',
    });
  });
  it('returns 200 and empty array if no moods exist', async () => {
    await prisma.journalEntry.deleteMany();
    const response = await request(createApp()).get('/api/moods');
    expect(response.status).toBe(200);
    const parsedResponse = listMoodsResponseSchema.parse(response.body);
    expect(parsedResponse.data).toHaveLength(0);
  });
});
