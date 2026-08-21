import { afterEach, describe, vi, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { App } from '../App';
import { renderWithProviders } from './renderWithProviders';
import { stubJson } from './stubJson';

/**
 * Worked example (mentor-written): a React Testing Library test.
 * It renders the component and queries the DOM the way a user perceives it
 * (by role and accessible name), not by implementation details like CSS classes.
 */

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('renders the application heading', async () => {
    stubJson({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    renderWithProviders(<App />);

    expect(screen.getByRole('heading', { name: 'MindLog' })).toBeInTheDocument();
    expect(await screen.findByText('No Entries Found')).toBeInTheDocument();
  });
});
