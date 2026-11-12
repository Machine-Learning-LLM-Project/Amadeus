import { z } from 'zod';

import { PRICE_PER_MILLION_TOKENS_USD } from '../constants.ts';
import { IdSchema, IsoDateTimeSchema } from './common.ts';

export const LlmFeatureSchema = z.enum([
  'estimate',
  'prioritize',
  'explain',
  'adjust',
  'brief',
  'baseline',
  'guardrail',
]);

export const LlmModeSchema = z.enum(['mock', 'live']);

/** One row per model call (mock calls are logged too, with zero cost). */
export const UsageLogEntrySchema = z.object({
  id: IdSchema,
  /** Null for eval runs that are not tied to a signed-in user. */
  userId: IdSchema.nullable(),
  feature: LlmFeatureSchema,
  model: z.string(),
  mode: LlmModeSchema,
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  latencyMs: z.number().int().min(0),
  costUsd: z.number().min(0),
  /** 1-based attempt number inside the retry loop. */
  attempt: z.number().int().min(1),
  ok: z.boolean(),
  error: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
});

export type LlmFeature = z.infer<typeof LlmFeatureSchema>;
export type LlmMode = z.infer<typeof LlmModeSchema>;
export type UsageLogEntry = z.infer<typeof UsageLogEntrySchema>;

/** Cost of one call in USD, from token counts and the configured price table. */
export function costUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens * PRICE_PER_MILLION_TOKENS_USD.input +
      outputTokens * PRICE_PER_MILLION_TOKENS_USD.output) /
    1_000_000
  );
}
