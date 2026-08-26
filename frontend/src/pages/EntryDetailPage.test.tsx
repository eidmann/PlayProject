import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/renderWithProviders';
import { EntryDetailPage } from './EntryDetailPage';
import { stubJson } from '../test/stubJson';
import { Route, Routes } from 'react-router';
import { getFetchUrl } from '../test/fetchTestUtils';
import userEvent from '@testing-library/user-event';
import { EntryListPage } from './EntryListPage';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('EntryDetailPage', () => {
  it('shows title, content, and mood from the API', async () => {
    stubJson({
      id: 'abc',
      title: 'My First Post',
      content: 'This is my first post',
      mood: 'GOOD',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    renderWithProviders(
      <Routes>
        <Route path="/entries/:id" element={<EntryDetailPage />} />
      </Routes>,
      { initialEntries: ['/entries/abc'] },
    );

    expect(await screen.findByRole('heading', { name: 'My First Post' })).toBeInTheDocument();
    expect(screen.getByText('This is my first post')).toBeInTheDocument();
    expect(screen.getByText('GOOD')).toBeInTheDocument();
  });

  it('shows omitted mood as "N/A"', async () => {
    stubJson({
      id: 'abc',
      title: 'My First Post',
      content: 'This is my first post',
      mood: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    renderWithProviders(
      <Routes>
        <Route path="/entries/:id" element={<EntryDetailPage />} />
      </Routes>,
      { initialEntries: ['/entries/abc'] },
    );

    expect(await screen.findByRole('heading', { name: 'My First Post' })).toBeInTheDocument();
    expect(screen.getByText('This is my first post')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('shows the API error when the entry does not exist', async () => {
    stubJson(
      {
        error: 'Entry not found',
      },
      404,
    );

    renderWithProviders(
      <Routes>
        <Route path="/entries/:id" element={<EntryDetailPage />} />
      </Routes>,
      { initialEntries: ['/entries/abc'] },
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Entry not found');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('shows the API error message when the server fails', async () => {
    stubJson({ error: 'Internal server error' }, 500);

    renderWithProviders(
      <Routes>
        <Route path="/entries/:id" element={<EntryDetailPage />} />
      </Routes>,
      { initialEntries: ['/entries/abc'] },
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Internal server error');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('links back to the list and to edit', async () => {
    stubJson({ id: 'abc', title: 'T', content: 'C', createdAt: '...', updatedAt: '...' });
    renderWithProviders(
      <Routes>
        <Route path="/entries/:id" element={<EntryDetailPage />} />
      </Routes>,
      { initialEntries: ['/entries/abc'] },
    );

    await screen.findByRole('heading', { name: 'T' });

    expect(screen.getByRole('link', { name: 'Back to entries' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/entries/abc/edit');
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

    renderWithProviders(
      <Routes>
        <Route path="/entries/:id" element={<EntryDetailPage />} />
      </Routes>,
      { initialEntries: ['/entries/abc'] },
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();

    resolveFetch(
      new Response(
        JSON.stringify({
          id: 'abc',
          title: 'Loaded',
          content: 'Done',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    expect(await screen.findByText('Back to entries')).toBeInTheDocument();
  });

  it('shows invalid link when id param is missing', async () => {
    renderWithProviders(<EntryDetailPage />, { initialEntries: ['/entries/abc'] });

    expect(await screen.findByText('Invalid entry link')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('deletes the entry', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (method === 'DELETE' && url.includes('/api/entries/abc')) {
        return new Response(null, { status: 204 });
      }

      if (url.includes('/api/entries/abc') && method === 'GET') {
        return new Response(
          JSON.stringify({
            id: 'abc',
            title: 'T',
            content: 'C',
            createdAt: '...',
            updatedAt: '...',
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
        <Route path="/" element={<EntryListPage />} />
        <Route path="/entries/:id" element={<EntryDetailPage />} />
      </Routes>,
      { initialEntries: ['/entries/abc'] },
    );

    expect(await screen.findByRole('heading', { name: 'T' })).toBeInTheDocument();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this entry?');

    const deleteCall = fetchMock.mock.calls.find((call) => {
      const url = getFetchUrl(call[0]);
      const method = call[1]?.method ?? (call[0] instanceof Request ? call[0].method : 'GET');
      return method === 'DELETE' && url.includes('/api/entries/abc');
    });

    expect(deleteCall).toBeDefined();
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this entry?');
    expect(await screen.findByText('No Entries Found')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'T' })).not.toBeInTheDocument();
  });

  it('stays on the detail page when the user cancels the deletion', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = getFetchUrl(input);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

      if (url.includes('/api/entries/abc') && method === 'GET') {
        return new Response(
          JSON.stringify({
            id: 'abc',
            title: 'T',
            content: 'C',
            createdAt: '...',
            updatedAt: '...',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(
      <Routes>
        <Route path="/entries/:id" element={<EntryDetailPage />} />
      </Routes>,
      { initialEntries: ['/entries/abc'] },
    );

    expect(await screen.findByRole('heading', { name: 'T' })).toBeInTheDocument();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(
      fetchMock.mock.calls.some((call) => {
        const method = call[1]?.method ?? (call[0] instanceof Request ? call[0].method : 'GET');
        return method === 'DELETE';
      }),
    ).toBe(false);
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this entry?');
    expect(await screen.findByRole('heading', { name: 'T' })).toBeInTheDocument();
  });
});
