export type OpenAiChatClient = {
  chat: {
    completions: {
      create: (
        body: {
          model: string;
          messages: Array<{ role: 'system' | 'user'; content: string }>;
          temperature?: number;
          max_tokens: number;
          response_format: { type: 'json_object' };
        },
        options?: { signal?: AbortSignal },
      ) => Promise<{
        choices: Array<{ message: { content: string | null } }>;
      }>;
    };
  };
};
