import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

/**
 * Worked example (mentor-written): a Supertest integration test.
 * It builds the real Express app and makes a real HTTP request against it —
 * no server process, no mocks. Study this pattern before Exercise 1.
 */

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
