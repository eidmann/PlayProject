import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { entriesApi } from '../api/entriesApi';

export const store = configureStore({
  reducer: {
    [entriesApi.reducerPath]: entriesApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(entriesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Pre-typed hooks: use these instead of the raw react-redux hooks
// so components get full type inference for state and dispatch.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
