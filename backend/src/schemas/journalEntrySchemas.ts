import { z } from 'zod';

export const createJournalEntrySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  mood: z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD']).nullable().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const updateJournalEntrySchema = createJournalEntrySchema;

export const listMoodsQuerySchema = z
  .object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .refine(
    (query) => {
      if (query.from === undefined || query.to === undefined) {
        return true;
      }
      return query.from <= query.to;
    },
    {
      message: 'From date must be before or equal to to date',
    },
  );
