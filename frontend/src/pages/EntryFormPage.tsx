import { useNavigate, useParams } from 'react-router';
import {
  useCreateEntryMutation,
  useGetEntryQuery,
  useUpdateEntryMutation,
} from '../api/entriesApi';
import { getApiErrorMessage } from '../api/errorMessage';
import { EntryFormFields } from '../components/EntryFormFields';
import type { Mood } from '../types/moodType';

export function EntryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id != null;
  const { data, isLoading, isError, error } = useGetEntryQuery(id ?? '', { skip: !isEdit });
  const [createEntry, { isLoading: isCreating, isError: isCreateError, error: createError }] =
    useCreateEntryMutation();
  const [updateEntry, { isLoading: isUpdating, isError: isUpdateError, error: updateError }] =
    useUpdateEntryMutation();

  async function handleCreateSubmit(title: string, content: string, mood: Mood) {
    const result = await createEntry({ title, content, mood });
    if ('data' in result && result.data) {
      await navigate(`/entries/${result.data.id}`);
    }
  }

  async function handleEditSubmit(title: string, content: string, mood: Mood) {
    if (!id) return;
    const result = await updateEntry({ id, title, content, mood });
    if ('data' in result && result.data) {
      await navigate(`/entries/${id}`);
    }
  }

  if (isEdit && isLoading) {
    return <div role="status">Loading...</div>;
  }
  if (isEdit && isError) {
    const message = getApiErrorMessage(error) ?? 'Something went wrong';
    return <div role="alert">{message}</div>;
  }
  if (isEdit && !data) {
    const message = getApiErrorMessage(error) ?? 'Entry not found';
    return <div role="alert">{message}</div>;
  }

  const heading = isEdit ? 'Edit Entry' : 'New Entry';
  const initialTitle = isEdit ? data?.title : '';
  const initialContent = isEdit ? data?.content : '';
  const initialMood = isEdit ? data?.mood : null;
  const onSubmit = isEdit ? handleEditSubmit : handleCreateSubmit;
  const submitErrorMessage = isEdit
    ? isUpdateError
      ? (getApiErrorMessage(updateError) ?? 'Something went wrong')
      : undefined
    : isCreateError
      ? (getApiErrorMessage(createError) ?? 'Something went wrong')
      : undefined;
  const isSaving = isEdit ? isUpdating : isCreating;

  return (
    <EntryFormFields
      heading={heading}
      initialTitle={initialTitle}
      initialContent={initialContent}
      initialMood={initialMood}
      onSubmit={onSubmit}
      isSaving={isSaving}
      submitErrorMessage={submitErrorMessage}
    />
  );
}
