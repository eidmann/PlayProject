import { useState } from 'react';
import type { Mood } from '../types/moodType';

interface EntryFormFieldsProps {
  heading: string;
  initialTitle?: string;
  initialContent?: string;
  initialMood?: Mood;
  isSaving?: boolean;
  submitErrorMessage?: string | undefined;
  onSubmit: (title: string, content: string, mood: Mood) => void | Promise<void>;
}
export function EntryFormFields({
  heading,
  initialTitle,
  initialContent,
  initialMood,
  isSaving,
  submitErrorMessage,
  onSubmit,
}: EntryFormFieldsProps) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [content, setContent] = useState(initialContent ?? '');
  const [mood, setMood] = useState(initialMood ?? null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void onSubmit(title, content, mood);
  }

  function parseMood(value: string): Mood {
    switch (value) {
      case 'GREAT':
        return 'GREAT';
      case 'GOOD':
        return 'GOOD';
      case 'OKAY':
        return 'OKAY';
      case 'LOW':
        return 'LOW';
      case 'BAD':
        return 'BAD';
    }
    return null;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>{heading}</h1>
      <label htmlFor="title">Title</label>
      <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor="content">Content</label>
      <input id="content" value={content} onChange={(e) => setContent(e.target.value)} />
      <label htmlFor="mood">Mood</label>
      <select
        id="mood"
        value={mood ?? ''}
        onChange={(e) => {
          const value = e.target.value;
          setMood(value === '' ? null : parseMood(value));
        }}
      >
        <option value="">No mood</option>
        <option value="GREAT">GREAT</option>
        <option value="GOOD">GOOD</option>
        <option value="OKAY">OKAY</option>
        <option value="LOW">LOW</option>
        <option value="BAD">BAD</option>
      </select>
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      {submitErrorMessage && <p role="alert">{submitErrorMessage}</p>}
    </form>
  );
}
