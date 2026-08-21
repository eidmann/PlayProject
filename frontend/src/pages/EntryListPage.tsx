import { Link } from 'react-router';
import { useGetEntriesQuery } from '../api/entriesApi';
import { useState } from 'react';

export function EntryListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetEntriesQuery({ page });

  if (isLoading) {
    return <div role="status">Loading...</div>;
  }

  if (isError) {
    return <div role="alert">Error loading entries</div>;
  }

  if (!data) {
    return null;
  }

  const { page: currentPage, totalPages } = data.pagination;

  return (
    <div>
      <h1>Entries</h1>
      <Link to="/entries/new">New Entry</Link>
      <p role="status">
        {data.pagination.total === 0
          ? 'No Entries Found'
          : `Showing ${data.pagination.total} entries`}
      </p>
      {data.data && data.data.length > 0 && (
        <ul>
          {data.data.map((entry) => (
            <li key={entry.id}>
              <Link to={`/entries/${entry.id}`}>{entry.title}</Link>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 0 && (
        <button type="button" onClick={() => setPage((p) => p - 1)} disabled={currentPage <= 1}>
          Previous
        </button>
      )}
      {totalPages > 0 && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      )}
    </div>
  );
}
