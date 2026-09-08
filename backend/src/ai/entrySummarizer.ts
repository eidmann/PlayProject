import type { Mood } from '@prisma/client';

export type SummarizeInput = {
  content: string;
  mood: Mood | null;
};

export type SummarizeResult =
  | { ok: true; summary: string; model: string }
  | { ok: false; reason: 'timeout' | 'rate_limited' | 'upstream_error' | 'invalid_response' };

export interface EntrySummarizer {
  summarize(input: SummarizeInput, signal?: AbortSignal): Promise<SummarizeResult>;
}
