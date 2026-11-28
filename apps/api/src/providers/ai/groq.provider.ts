import Groq from 'groq-sdk';
import { z } from 'zod';
import { modelDraftSchema, type ModelDraft } from '../../schemas/draft.schema.js';
import type { AiProvider } from '../../types/draft.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js';

const REQUEST_TIMEOUT_MS = 15_000;

/** Never trust model output: it must be JSON, non-empty and match our schema. */
export function parseModelDraft(text: string | null | undefined): ModelDraft {
  if (!text) throw new Error('Groq returned an empty response');

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Groq response was not valid JSON');
  }

  const result = modelDraftSchema.safeParse(json);
  if (!result.success) throw new Error('Groq response did not match the expected shape');
  return result.data;
}

export function createGroqProvider({
  apiKey,
  model,
}: {
  apiKey: string;
  model: string;
}): AiProvider {
  // One retry covers a brief hiccup; the service falls back to the template if it still fails.
  const client = new Groq({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 });
  const responseSchema = z.toJSONSchema(modelDraftSchema);
  delete responseSchema.$schema;

  return {
    async generate({ content, tone }) {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(content, tone) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'reply_draft', strict: true, schema: responseSchema },
        },
      });
      return parseModelDraft(completion.choices[0]?.message.content);
    },
  };
}
