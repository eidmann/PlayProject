import type { JournalEntry } from '../api/entriesApi';
import type { Mood } from '../types/moodType';

export function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return String(input);
}

export async function getRequestBody(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<string> {
  if (typeof init?.body === 'string') {
    return init.body;
  }
  if (input instanceof Request) {
    return input.clone().text();
  }
  return '';
}

const MOOD_VALUES = ['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD'];
function isMood(value: unknown): value is Mood {
  return value === null || (typeof value === 'string' && MOOD_VALUES.some((m) => m === value));
}
// allow mood as null
export function parseEntryWriteBody(raw: string): Pick<JournalEntry, 'title' | 'content' | 'mood'> {
  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('title' in parsed) ||
    !('content' in parsed) ||
    !('mood' in parsed) ||
    typeof parsed.title !== 'string' ||
    typeof parsed.content !== 'string' ||
    !isMood(parsed.mood)
  ) {
    throw new Error('Invalid JSON body');
  }
  return { title: parsed.title, content: parsed.content, mood: parsed.mood };
}
