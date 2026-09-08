import type { SummarizeInput } from './entrySummarizer.js';

export function buildSummaryPrompt(input: SummarizeInput): Array<{
  role: 'system' | 'user';
  content: string;
}> {
  return [
    {
      role: 'system',
      content:
        'You summarize a journal entry; reply with JSON only: { "summary": "<string>" }; 2–4 sentences; no advice, no diagnosis',
    },
    { role: 'user', content: `Content: ${input.content}\nMood: ${input.mood ?? 'none'}` },
  ];
}
