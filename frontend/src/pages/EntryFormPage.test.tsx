import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '../test/renderWithProviders';
import { EntryFormPage } from './EntryFormPage';
import { EntryDetailPage } from './EntryDetailPage';
import { getFetchUrl, getRequestBody, parseEntryWriteBody } from '../test/fetchTestUtils';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('EntryFormPage create', () => {
  it('creates an entry and navigates to its detail page', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'POST' && url.endsWith('/api/entries')) {
        const body = parseEntryWriteBody(await getRequestBody(input, init));
        return new Response(
          JSON.stringify({
            id: 'new-id',
            title: body.title,
            content: body.content,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Detail page after navigate will GET entry
      if (url.includes('/api/entries/new-id') && method === 'GET') {
        return new Response(
          JSON.stringify({
            id: 'new-id',
            title: 'My title',
            content: 'My content',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (method === 'GET' && url.includes('/api/entries')) {
        return new Response(
          JSON.stringify({
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(
      <Routes>
        <Route path="/entries/new" element={<EntryFormPage />} />
        <Route path="/entries/:id" element={<EntryDetailPage />} />
      </Routes>,
      { initialEntries: ['/entries/new'] },
    );

    await userEvent.type(screen.getByLabelText(/title/i), 'My title');
    await userEvent.type(screen.getByLabelText(/content/i), 'My content');
    await userEvent.click(screen.getByRole('button', { name: /create|Save|submit/i }));

    expect(await screen.findByRole('heading', { name: 'My title' })).toBeInTheDocument();

    const postCall = fetchMock.mock.calls.find((call) => {
      const url = getFetchUrl(call[0]);
      const method = call[1]?.method ?? (call[0] instanceof Request ? call[0].method : 'GET');
      return method === 'POST' && url.endsWith('/api/entries');
    });

    expect(JSON.parse(await getRequestBody(postCall![0], postCall![1]))).toEqual({
      title: 'My title',
      content: 'My content',
    });
  });

  it('shows the API error when validation fails', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'POST' && url.endsWith('/api/entries')) {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(
      <Routes>
        <Route path="/entries/new" element={<EntryFormPage />} />
      </Routes>,
      { initialEntries: ['/entries/new'] },
    );

    await userEvent.click(screen.getByRole('button', { name: /create|Save|submit/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid request body');
    expect(screen.getByRole('heading', { name: 'New Entry' })).toBeInTheDocument();
  });
});

describe('EntryFormPage edit', () => {
  it('prefills the form when editing an existing entry', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'GET' && url.includes('/api/entries/abc')) {
        return new Response(
          JSON.stringify({
            id: 'abc',
            title: 'Existing title',
            content: 'Existing content',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(
      <Routes>
        <Route path="/entries/:id/edit" element={<EntryFormPage />} />
      </Routes>,
      { initialEntries: ['/entries/abc/edit'] },
    );

    expect(await screen.findByLabelText(/title/i)).toHaveValue('Existing title');
    expect(await screen.findByLabelText(/content/i)).toHaveValue('Existing content');
  });
  it('updates an entry and navigates to its detail page', async () => {
    const entry = {
      id: 'abc',
      title: 'Existing title',
      content: 'Existing content',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'GET' && url.includes('/api/entries/abc')) {
        return new Response(
          JSON.stringify({
            id: entry.id,
            title: entry.title,
            content: entry.content,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (method === 'PUT' && url.includes('/api/entries/abc')) {
        const body = parseEntryWriteBody(await getRequestBody(input, init));
        entry.title = body.title;
        entry.content = body.content;
        entry.updatedAt = new Date().toISOString();
        return new Response(
          JSON.stringify({
            id: entry.id,
            title: entry.title,
            content: entry.content,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (method === 'GET' && url.includes('/api/entries')) {
        return new Response(
          JSON.stringify({
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(
      <Routes>
        <Route path="/entries/:id/edit" element={<EntryFormPage />} />
        <Route path="/entries/:id" element={<EntryDetailPage />} />
      </Routes>,
      { initialEntries: ['/entries/abc/edit'] },
    );

    expect(await screen.findByLabelText(/title/i)).toHaveValue('Existing title');
    expect(await screen.findByLabelText(/content/i)).toHaveValue('Existing content');

    await userEvent.clear(screen.getByLabelText(/title/i));
    await userEvent.type(screen.getByLabelText(/title/i), 'Updated title');
    await userEvent.clear(screen.getByLabelText(/content/i));
    await userEvent.type(screen.getByLabelText(/content/i), 'Updated content');
    await userEvent.click(screen.getByRole('button', { name: /update|Save|submit/i }));

    expect(await screen.findByRole('heading', { name: 'Updated title' })).toBeInTheDocument();
    expect(await screen.findByText('Updated content')).toBeInTheDocument();

    const putCall = fetchMock.mock.calls.find((call) => {
      const url = getFetchUrl(call[0]);
      const method = call[1]?.method ?? (call[0] instanceof Request ? call[0].method : 'GET');
      return method === 'PUT' && url.includes('/api/entries/abc');
    });
    expect(JSON.parse(await getRequestBody(putCall![0], putCall![1]))).toEqual({
      title: 'Updated title',
      content: 'Updated content',
    });
  });
});
