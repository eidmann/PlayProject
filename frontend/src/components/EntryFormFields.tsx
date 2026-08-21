import { useState } from 'react';

interface EntryFormFieldsProps {
  heading: string;
  initialTitle?: string;
  initialContent?: string;
  isSaving?: boolean;
  submitErrorMessage?: string | undefined;
  onSubmit: (title: string, content: string) => void | Promise<void>;
}
export function EntryFormFields({
  heading,
  initialTitle,
  initialContent,
  isSaving,
  submitErrorMessage,
  onSubmit,
}: EntryFormFieldsProps) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [content, setContent] = useState(initialContent ?? '');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void onSubmit(title, content);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>{heading}</h1>
      <label htmlFor="title">Title</label>
      <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor="content">Content</label>
      <input id="content" value={content} onChange={(e) => setContent(e.target.value)} />
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      {submitErrorMessage && <p role="alert">{submitErrorMessage}</p>}
    </form>
  );
}
