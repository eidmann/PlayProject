import { describe, expect, it } from 'vitest';
import type { OpenAiChatClient } from '../ai/openaiChatClient.js';
import { OpenAISummarizer } from '../ai/openaiEntrySummarizer.js';
import { APIConnectionTimeoutError, APIError, RateLimitError } from 'openai';

function makeClient(create: OpenAiChatClient['chat']['completions']['create']): OpenAiChatClient {
  return { chat: { completions: { create } } };
}

describe('OpenAISummarizer', () => {
  it('returns ok with the parsed summary and model', async () => {
    const client = makeClient(() =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: JSON.stringify({ summary: 'A calm, positive day' }),
            },
          },
        ],
      }),
    );

    const summarizer = new OpenAISummarizer(client, 'gpt-4o-mini');
    const result = await summarizer.summarize({
      content: 'I had a great day today!',
      mood: 'GOOD',
    });
    expect(result).toEqual({
      ok: true,
      summary: 'A calm, positive day',
      model: 'gpt-4o-mini',
    });
  });

  it('returns invalid_response if content is null', async () => {
    const client = makeClient(() =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      }),
    );

    const summarizer = new OpenAISummarizer(client, 'gpt-4o-mini');
    const result = await summarizer.summarize({
      content: 'I had a great day today!',
      mood: 'GOOD',
    });
    expect(result).toEqual({ ok: false, reason: 'invalid_response' });
  });

  it('returns invalid_response if content is invalid JSON', async () => {
    const client = makeClient(() =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: 'not a valid JSON',
            },
          },
        ],
      }),
    );
    const summarizer = new OpenAISummarizer(client, 'gpt-4o-mini');
    const result = await summarizer.summarize({
      content: 'I had a great day today!',
      mood: 'GOOD',
    });
    expect(result).toEqual({ ok: false, reason: 'invalid_response' });
  });

  it('returns invalid_response if zod fails when summary is missing', async () => {
    const client = makeClient(() =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: JSON.stringify({ nope: true }),
            },
          },
        ],
      }),
    );
    const summarizer = new OpenAISummarizer(client, 'gpt-4o-mini');
    const result = await summarizer.summarize({
      content: 'I had a great day today!',
      mood: 'GOOD',
    });
    expect(result).toEqual({ ok: false, reason: 'invalid_response' });
  });

  it('returns invalid_response if zod fails when empty string', async () => {
    const client = makeClient(() =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: JSON.stringify({ summary: '' }),
            },
          },
        ],
      }),
    );
    const summarizer = new OpenAISummarizer(client, 'gpt-4o-mini');
    const result = await summarizer.summarize({
      content: 'I had a great day today!',
      mood: 'GOOD',
    });
    expect(result).toEqual({ ok: false, reason: 'invalid_response' });
  });

  it('returns timeout if error instanceof APIConnectionTimeoutError', async () => {
    const client = makeClient(() => Promise.reject(new APIConnectionTimeoutError()));

    const summarizer = new OpenAISummarizer(client, 'gpt-4o-mini');
    const result = await summarizer.summarize({
      content: 'I had a great day today!',
      mood: 'GOOD',
    });

    expect(result).toEqual({ ok: false, reason: 'timeout' });
  });

  it('returns rate_limited if error instanceof RateLimitError', async () => {
    const client = makeClient(() =>
      Promise.reject(new RateLimitError(429, {}, 'rate_limited', new Headers())),
    );
    const summarizer = new OpenAISummarizer(client, 'gpt-4o-mini');
    const result = await summarizer.summarize({
      content: 'I had a great day today!',
      mood: 'GOOD',
    });
    expect(result).toEqual({ ok: false, reason: 'rate_limited' });
  });

  it('returns upstream_error if error instanceof APIError', async () => {
    const client = makeClient(() =>
      Promise.reject(new APIError(500, {}, 'upstream_error', new Headers())),
    );
    const summarizer = new OpenAISummarizer(client, 'gpt-4o-mini');
    const result = await summarizer.summarize({
      content: 'I had a great day today!',
      mood: 'GOOD',
    });
    expect(result).toEqual({ ok: false, reason: 'upstream_error' });
  });

  it('rethrows unexpected errors', async () => {
    const client = makeClient(() => Promise.reject(new Error('bug')));
    const summarizer = new OpenAISummarizer(client, 'gpt-4o-mini');
    await expect(
      summarizer.summarize({ content: 'I had a great day today!', mood: 'GOOD' }),
    ).rejects.toThrow('bug');
  });
});
