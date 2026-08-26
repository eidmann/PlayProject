import { Link } from 'react-router';
import { useGetMoodHistoryQuery } from '../api/entriesApi';
import { getApiErrorMessage } from '../api/errorMessage';

export function MoodHistoryPage() {
  const { data, isLoading, isError, error } = useGetMoodHistoryQuery();

  if (isLoading) return <div role="status">Loading...</div>;
  if (isError) {
    const message = getApiErrorMessage(error) ?? 'Something went wrong';
    return <div role="alert">{message}</div>;
  }
  if (!data) {
    const message = getApiErrorMessage(error) ?? 'No data';
    return <div role="status">{message}</div>;
  }

  return (
    <div>
      <h1>Mood History</h1>
      <p role="status">
        {data.data.length === 0 ? 'No data' : `Showing ${data.data.length} moods`}
      </p>
      <ul>
        {data.data.map((mood) => (
          <li key={mood.id}>
            {mood.mood} on {mood.createdAt}
          </li>
        ))}
      </ul>
      <Link to="/">Back to entries</Link>
    </div>
  );
}
