import { configureStore } from '@reduxjs/toolkit';
import { entriesApi } from '../api/entriesApi';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

function createTestStore() {
  return configureStore({
    reducer: {
      [entriesApi.reducerPath]: entriesApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(entriesApi.middleware),
  });
}

export function renderWithProviders(ui: ReactElement, options?: { initialEntries?: string[] }) {
  const store = createTestStore();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={options?.initialEntries ?? ['/']}>{children}</MemoryRouter>
      </Provider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}
