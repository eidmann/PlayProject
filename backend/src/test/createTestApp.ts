import { createApp, type AppDependencies } from '../app.js';
import type { EntrySummarizer } from '../ai/entrySummarizer.js';

export function fakeSummarizer(overrides: Partial<EntrySummarizer> = {}): EntrySummarizer {
  return {
    summarize: () =>
      Promise.resolve({
        ok: true,
        summary: 'fake summary',
        model: 'fake-model',
      }),
    ...overrides,
  };
}

export function createTestApp(overrides: Partial<AppDependencies> = {}) {
  return createApp({
    summarizer: fakeSummarizer(),
    ...overrides,
  });
}
