import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1).url().startsWith('postgres'),
  DIRECT_URL: z.string().min(1).url().startsWith('postgres'),
  OPENAI_API_KEY: z.string().min(1),
});

export type Config = z.infer<typeof configSchema>;

export function parseConfig(env: Record<string, string | undefined>): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(`Invalid environment configuration: ${fields.join(', ')}`);
  }
  return result.data;
}
