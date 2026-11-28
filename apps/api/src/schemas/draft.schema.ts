import { z } from 'zod';

export const toneSchema = z.enum(['friendly', 'professional', 'empathetic']);
export type Tone = z.infer<typeof toneSchema>;

export const generateRequestSchema = z.object({
  discussionId: z.uuid(),
  tone: toneSchema,
});

/**
 * What the model must return. Also sent to Groq as the JSON schema, so every field is required:
 * strict mode has no optional fields, which is why "no warning" is an empty string.
 */
export const modelDraftSchema = z.object({
  suggestedReply: z.string().trim().min(1).max(1000),
  approach: z.string().trim().min(1).max(300),
  safetyWarning: z.string().trim().max(300),
});
export type ModelDraft = z.infer<typeof modelDraftSchema>;
