import { z } from 'zod';

// Empty strings in .env files mean "not set", so treat them as undefined.
const optionalString = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional());

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    FRONTEND_ORIGIN: z.url(),
    SUPABASE_URL: z.url(),
    SUPABASE_SECRET_KEY: z.string().min(1),
    // Without an API key the app falls back to deterministic templates.
    GROQ_API_KEY: optionalString,
    GROQ_MODEL: optionalString,
  })
  .refine((env) => !env.GROQ_API_KEY || env.GROQ_MODEL, {
    path: ['GROQ_MODEL'],
    message: 'GROQ_MODEL is required when GROQ_API_KEY is set',
  });

export type Env = z.infer<typeof envSchema>;

/** Fails fast at startup with a readable list of what is missing, never printing values. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  const problems = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  throw new Error(`Invalid environment configuration:\n- ${problems.join('\n- ')}`);
}
