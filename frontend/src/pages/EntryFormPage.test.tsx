import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '../test/renderWithProviders';
import { EntryFormPage } from './EntryFormPage';
import { EntryDetailPage } from './EntryDetailPage';
import { getFetchUrl, getRequestBody, parseEntryWriteBody } from '../test/fetchTestUtils';
import type { JournalEntry } from '../api/entriesApi';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'abc',
    title: 'Existing title',
    content: 'Existing content',
    mood: 'GOOD',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

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
            mood: body.mood,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes('/api/entries/new-id') && method === 'GET') {
        return new Response(
          JSON.stringify({
            id: 'new-id',
            title: 'My title',
            content: 'My content',
            mood: 'GOOD',
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
    await userEvent.selectOptions(screen.getByLabelText(/mood/i), 'GOOD');
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
      mood: 'GOOD',
    });
  });

  it('creates an entry with no mood and navigates to its detail page', async () => {
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

      if (url.includes('/api/entries/new-id') && method === 'GET') {
        return new Response(
          JSON.stringify({
            id: 'new-id',
            title: 'My title',
            content: 'My content',
            mood: null,
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
      mood: null,
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
    const entry = makeEntry();
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'GET' && url.includes('/api/entries/abc')) {
        return new Response(JSON.stringify(entry), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
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
    expect(await screen.findByLabelText(/mood/i)).toHaveValue('GOOD');
  });

  it('updates an entry and navigates to its detail page', async () => {
    const entry = makeEntry();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'GET' && url.includes('/api/entries/abc')) {
        return new Response(JSON.stringify(entry), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'PUT' && url.includes('/api/entries/abc')) {
        const body = parseEntryWriteBody(await getRequestBody(input, init));
        entry.title = body.title;
        entry.content = body.content;
        entry.mood = body.mood;
        entry.updatedAt = new Date().toISOString();
        return new Response(JSON.stringify(entry), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
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
    expect(await screen.findByLabelText(/mood/i)).toHaveValue('GOOD');

    await userEvent.clear(screen.getByLabelText(/title/i));
    await userEvent.type(screen.getByLabelText(/title/i), 'Updated title');
    await userEvent.clear(screen.getByLabelText(/content/i));
    await userEvent.type(screen.getByLabelText(/content/i), 'Updated content');
    await userEvent.selectOptions(screen.getByLabelText(/mood/i), 'BAD');
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
      mood: 'BAD',
    });
  });

  it('updates mood to null if "no mood" is selected and navigates to its detail page', async () => {
    const entry = makeEntry();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'GET' && url.includes('/api/entries/abc')) {
        return new Response(JSON.stringify(entry), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'PUT' && url.includes('/api/entries/abc')) {
        const body = parseEntryWriteBody(await getRequestBody(input, init));
        entry.title = body.title;
        entry.content = body.content;
        entry.mood = body.mood;
        entry.updatedAt = new Date().toISOString();
        return new Response(JSON.stringify(entry), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
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
    await userEvent.selectOptions(screen.getByLabelText(/mood/i), 'No mood');
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
      mood: null,
    });
  });

  it('sends existing mood when only title changes', async () => {
    const entry = makeEntry();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'GET' && url.includes('/api/entries/abc')) {
        return new Response(JSON.stringify(entry), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'PUT' && url.includes('/api/entries/abc')) {
        const body = parseEntryWriteBody(await getRequestBody(input, init));
        entry.title = body.title;
        entry.content = body.content;
        entry.mood = body.mood;
        entry.updatedAt = new Date().toISOString();
        return new Response(JSON.stringify(entry), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
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
    await userEvent.click(screen.getByRole('button', { name: /update|Save|submit/i }));

    expect(await screen.findByRole('heading', { name: 'Updated title' })).toBeInTheDocument();
    expect(await screen.findByText('Existing content')).toBeInTheDocument();

    const putCall = fetchMock.mock.calls.find((call) => {
      const url = getFetchUrl(call[0]);
      const method = call[1]?.method ?? (call[0] instanceof Request ? call[0].method : 'GET');
      return method === 'PUT' && url.includes('/api/entries/abc');
    });
    expect(JSON.parse(await getRequestBody(putCall![0], putCall![1]))).toEqual({
      title: 'Updated title',
      content: 'Existing content',
      mood: 'GOOD',
    });
  });
});
