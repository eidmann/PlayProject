import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/renderWithProviders';
import { MoodHistoryPage } from './MoodHistoryPage';
import { getFetchUrl } from '../test/fetchTestUtils';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('MoodHistoryPage', () => {
  it('shows list of moods and dates', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'GET' && url.includes('/api/moods')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 'abc',
                createdAt: '2026-01-01T00:00:00.000Z',
                mood: 'GOOD',
              },
              {
                id: 'def',
                createdAt: '2026-01-02T00:00:00.000Z',
                mood: 'BAD',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<MoodHistoryPage />);

    expect(await screen.findByText('GOOD on 2026-01-01T00:00:00.000Z')).toBeInTheDocument();
    expect(await screen.findByText('BAD on 2026-01-02T00:00:00.000Z')).toBeInTheDocument();
  });

  it('shows no moods when the API returns an empty array', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'GET' && url.includes('/api/moods')) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<MoodHistoryPage />);

    expect(await screen.findByText('No data')).toBeInTheDocument();
    expect(screen.queryByText(/GOOD|BAD/i)).not.toBeInTheDocument();
  });

  it('shows loading when the data is loading', async () => {
    let resolveFetch!: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => fetchPromise),
    );

    renderWithProviders(<MoodHistoryPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText(/GOOD|BAD/i)).not.toBeInTheDocument();

    resolveFetch(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    expect(await screen.findByText('Back to entries')).toBeInTheDocument();
    expect(await screen.findByText('No data')).toBeInTheDocument();
  });

  it('shows the API error when the server fails', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'GET' && url.includes('/api/moods')) {
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<MoodHistoryPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Internal server error');
    expect(screen.queryByText(/GOOD|BAD/i)).not.toBeInTheDocument();
  });
});
