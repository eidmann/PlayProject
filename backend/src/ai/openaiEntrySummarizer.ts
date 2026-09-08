import { z } from 'zod';
import { buildSummaryPrompt } from './buildSummaryPrompt.js';
import type { EntrySummarizer, SummarizeInput, SummarizeResult } from './entrySummarizer.js';
import type { OpenAiChatClient } from './openaiChatClient.js';
import { APIConnectionTimeoutError, APIError, RateLimitError } from 'openai';

const summaryJsonSchema = z.object({
  summary: z.string().min(1),
});

export class OpenAISummarizer implements EntrySummarizer {
  constructor(
    private readonly client: OpenAiChatClient,
    private readonly model: string,
  ) {}

  async summarize(input: SummarizeInput, signal?: AbortSignal): Promise<SummarizeResult> {
    const messages = buildSummaryPrompt(input);
    try {
      const response = await this.client.chat.completions.create(
        {
          model: this.model,
          messages,
          temperature: 0.2,
          max_tokens: 300,
          response_format: { type: 'json_object' },
        },
        signal ? { signal } : undefined,
      );

      const content = response.choices[0]?.message.content;
      if (content === null || content === undefined) {
        return { ok: false, reason: 'invalid_response' };
      }

      let raw: unknown;
      try {
        raw = JSON.parse(content);
      } catch {
        return { ok: false, reason: 'invalid_response' };
      }

      const parsed = summaryJsonSchema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false, reason: 'invalid_response' };
      }

      return {
        ok: true,
        summary: parsed.data.summary,
        model: this.model,
      };
    } catch (error) {
      if (error instanceof APIConnectionTimeoutError) {
        return { ok: false, reason: 'timeout' };
      }
      if (error instanceof RateLimitError) {
        return { ok: false, reason: 'rate_limited' };
      }
      if (error instanceof APIError) {
        return { ok: false, reason: 'upstream_error' };
      }
      throw error;
    }
  }
}
