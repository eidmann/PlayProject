import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

/**
 * Worked example (mentor-written): a React Testing Library test.
 * It renders the component and queries the DOM the way a user perceives it
 * (by role and accessible name), not by implementation details like CSS classes.
 */
describe('App', () => {
  it('renders the application heading', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'MindLog' })).toBeInTheDocument();
  });
});
