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

export const statusSchema = z.enum(['draft', 'reviewed', 'dismissed']);
export const aiProviderSchema = z.enum(['groq', 'template']);

const draftTextSchema = z.string().trim().min(1, 'Draft text cannot be empty').max(2000);

export const createDraftSchema = z.object({
  discussionId: z.uuid(),
  draftText: draftTextSchema,
  tone: toneSchema,
  aiProvider: aiProviderSchema,
});

export const updateDraftSchema = z
  .object({ draftText: draftTextSchema.optional(), status: statusSchema.optional() })
  .refine((changes) => changes.draftText !== undefined || changes.status !== undefined, {
    message: 'Send draftText or status to update',
  });

export const idParamSchema = z.object({ id: z.uuid() });

export type DraftStatus = z.infer<typeof statusSchema>;
export type NewDraft = z.infer<typeof createDraftSchema>;
export type DraftChanges = z.infer<typeof updateDraftSchema>;
