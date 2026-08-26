import { Link, useNavigate, useParams } from 'react-router';
import { useDeleteEntryMutation, useGetEntryQuery } from '../api/entriesApi';
import { getApiErrorMessage } from '../api/errorMessage';

export function EntryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isError, isLoading, error } = useGetEntryQuery(id ?? '', { skip: !id });
  const [deleteEntry, { isLoading: isDeleting, isError: isDeleteError, error: deleteError }] =
    useDeleteEntryMutation();

  if (!id) return <div role="alert">Invalid entry link</div>;

  if (isLoading) return <div role="status">Loading...</div>;

  if (isError) {
    const message = getApiErrorMessage(error) ?? 'Something went wrong';
    return <div role="alert">{message}</div>;
  }
  if (!data) {
    const message = getApiErrorMessage(error) ?? 'Entry not found';
    return <div role="alert">{message}</div>;
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      const result = await deleteEntry(data.id);
      if (!('error' in result)) {
        await navigate('/');
      }
    }
  };

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
      <p>{data.mood ?? 'N/A'}</p>
      <Link to={`/entries/${data.id}/edit`}>Edit</Link>
      <button
        type="button"
        onClick={() => {
          void handleDelete();
        }}
        disabled={isDeleting}
      >
        Delete
      </button>
      {isDeleteError && (
        <div role="alert">{getApiErrorMessage(deleteError) ?? 'Something went wrong'}</div>
      )}
      {isDeleting && <div role="status">Deleting...</div>}
      <Link to="/">Back to entries</Link>
    </div>
  );
}
