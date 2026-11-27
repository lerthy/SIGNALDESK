import { z } from 'zod';

export const searchQuerySchema = z.object({
  query: z.string().trim().min(2, 'Enter at least 2 characters').max(100),
  source: z.enum(['demo', 'bluesky']).default('demo'),
});
