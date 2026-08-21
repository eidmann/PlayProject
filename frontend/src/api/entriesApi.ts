import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedEntries = {
  data: JournalEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export const entriesApi = createApi({
  reducerPath: 'entriesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Entry'],
  endpoints: (builder) => ({
    getEntries: builder.query<PaginatedEntries, { page?: number; limit?: number } | void>({
      query: (args) => ({
        url: '/entries',
        params: { page: args?.page ?? 1, limit: args?.limit ?? 10 },
      }),
      providesTags: ['Entry'],
    }),
    getEntry: builder.query<JournalEntry, string>({
      query: (id) => `/entries/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Entry', id }],
    }),
    createEntry: builder.mutation<JournalEntry, { title: string; content: string }>({
      query: (body) => ({
        url: '/entries',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Entry'],
    }),
    updateEntry: builder.mutation<JournalEntry, { id: string; title: string; content: string }>({
      query: ({ id, title, content }) => ({
        url: `/entries/${id}`,
        method: 'PUT',
        body: { title, content },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Entry', id }, 'Entry'],
    }),
    deleteEntry: builder.mutation<void, string>({
      query: (id) => ({
        url: `/entries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Entry', id }, 'Entry'],
    }),
  }),
});

export const {
  useGetEntriesQuery,
  useGetEntryQuery,
  useCreateEntryMutation,
  useUpdateEntryMutation,
  useDeleteEntryMutation,
} = entriesApi;
