import { describe, expect, it } from 'vitest';
import { buildSummaryPrompt } from '../ai/buildSummaryPrompt.js';
import type { SummarizeInput } from '../ai/entrySummarizer.js';

describe('buildSummaryPrompt', () => {
  it('should build a summary prompt', () => {
    const input: SummarizeInput = {
      content: 'I had a great day today!',
      mood: 'GOOD',
    };
    const prompt = buildSummaryPrompt(input);
    expect(prompt).toHaveLength(2);
    expect(prompt[0]?.role).toBe('system');
    expect(prompt[0]?.content.toLowerCase()).toContain('json');
    expect(prompt[1]?.role).toBe('user');
    expect(prompt[1]?.content).toContain('I had a great day today!');
    expect(prompt[1]?.content).toContain('GOOD');
  });

  it('builds a summary prompt without mood as none', () => {
    const input: SummarizeInput = {
      content: 'I had a great day today!',
      mood: null,
    };
    const prompt = buildSummaryPrompt(input);
    expect(prompt[1]?.content).toContain('none');
    expect(prompt[1]?.content).not.toContain('null');
  });
});
