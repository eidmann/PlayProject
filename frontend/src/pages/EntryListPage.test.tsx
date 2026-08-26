import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/renderWithProviders';
import { EntryListPage } from './EntryListPage';
import { stubJson } from '../test/stubJson';
import userEvent from '@testing-library/user-event';
import { getFetchUrl } from '../test/fetchTestUtils';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('EntryListPage', () => {
  it('shows entry titles from the API as links', async () => {
    stubJson({
      data: [
        {
          id: 'abc',
          title: 'My first entry',
          content: 'Content of my first entry',
          mood: 'GOOD',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    renderWithProviders(<EntryListPage />);

    expect(await screen.findByRole('link', { name: 'My first entry' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'My first entry' })).toHaveAttribute(
      'href',
      '/entries/abc',
    );
    expect(screen.queryByText('GOOD')).not.toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /View Mood History/i })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /View Mood History/i })).toHaveAttribute(
      'href',
      '/moods',
    );
  });

  it('shows empty message when there are no entries', async () => {
    stubJson({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    renderWithProviders(<EntryListPage />);

    expect(await screen.findByText('No Entries Found')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'New Entry' })).toBeInTheDocument();
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

    renderWithProviders(<EntryListPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    resolveFetch(
      new Response(
        JSON.stringify({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    expect(await screen.findByText('No Entries Found')).toBeInTheDocument();
  });

  it('shows error when fetch fails', async () => {
    stubJson({ error: 'Internal server error' }, 500);

    renderWithProviders(<EntryListPage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(await screen.findByText('Error loading entries')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('links to the new entry form', async () => {
    stubJson({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    renderWithProviders(<EntryListPage />);

    const newEntryLink = await screen.findByRole('link', { name: 'New Entry' });
    expect(newEntryLink).toHaveAttribute('href', '/entries/new');
  });

  it('loads the next page when the Next is clicked', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = getFetchUrl(input);
      if (url.includes('page=1')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: '1',
                  title: 'Page one entry',
                  content: 'x',
                  mood: 'GOOD',
                  createdAt: '...',
                  updatedAt: '...',
                },
              ],
              pagination: { page: 1, limit: 10, total: 11, totalPages: 2 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('page=2')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: '2',
                  title: 'Page two entry',
                  content: 'y',
                  mood: 'BAD',
                  createdAt: '...',
                  updatedAt: '...',
                },
              ],
              pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<EntryListPage />);

    expect(await screen.findByRole('link', { name: 'Page one entry' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByRole('link', { name: 'Page two entry' })).toBeInTheDocument();
    expect(screen.queryByText('GOOD')).not.toBeInTheDocument();
  });

  it('disables the Previous button when on the first page', async () => {
    stubJson({
      data: [],
      pagination: { page: 1, limit: 10, total: 10, totalPages: 2 },
    });

    renderWithProviders(<EntryListPage />);

    const previous = await screen.findByRole('button', { name: 'Previous' });
    expect(previous).toBeDisabled();
  });

  it('dont render Next button when no pages', () => {
    stubJson({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    renderWithProviders(<EntryListPage />);

    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('disables Next button on last page', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = getFetchUrl(input);
      if (url.includes('page=1')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: '1',
                  title: 'Page one entry',
                  content: 'x',
                  mood: 'GOOD',
                  createdAt: '...',
                  updatedAt: '...',
                },
              ],
              pagination: { page: 1, limit: 10, total: 11, totalPages: 2 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('page=2')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: '2',
                  title: 'Page two entry',
                  content: 'y',
                  mood: 'BAD',
                  createdAt: '...',
                  updatedAt: '...',
                },
              ],
              pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<EntryListPage />);

    const next = await screen.findByRole('button', { name: 'Next' });
    expect(next).toBeEnabled();
    await userEvent.click(next);

    expect(await screen.findByRole('link', { name: 'Page two entry' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.queryByText('BAD')).not.toBeInTheDocument();
  });
});
