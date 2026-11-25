import { z } from 'zod';

import {
  ALLOWED_MODEL, DEFAULT_MAX_OUTPUT_TOKENS, MAX_LOOP_ATTEMPTS,
  MONTHLY_SPEND_LIMIT_USD,
} from '../../../shared/constants.ts';
import { UsageLogEntrySchema, type UsageLogEntry } from '../../../shared/schemas/usage.ts';
import { checkOutput, GuardrailError } from './guardrails.ts';

const CallSchema = UsageLogEntrySchema.pick({ userId: true, feature: true }).extend({
  mode: z.enum(['mock', 'live']).default('mock'),
  attempt: z.number().int().min(1).max(MAX_LOOP_ATTEMPTS).default(1),
  maxOutputTokens: z.number().int().min(1).max(DEFAULT_MAX_OUTPUT_TOKENS)
    .default(DEFAULT_MAX_OUTPUT_TOKENS),
});
const PricesSchema = z.object({ input: z.number().positive(), output: z.number().positive() });
const ProviderResultSchema = z.object({
  output: z.unknown(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
});

export type UsageStore = {
  /** Atomic team-wide check + insert. Throw budget_exceeded before any paid call. */
  reserve(entry: UsageLogEntry, reservedUsd: number): Promise<void>;
  /** Persist result and release reservation only if the provider's usage is known. */
  finish(entry: UsageLogEntry, usageKnown: boolean): Promise<void>;
};

export type ModelRequest = {
  model: typeof ALLOWED_MODEL;
  maxOutputTokens: number;
  messages: { role: 'system' | 'user'; content: string }[];
};

/** Implemented by Gilberto's server-only connection, never by client request data. */
export type LiveProvider = {
  prices: z.infer<typeof PricesSchema>;
  /** Must be verified against course/provider pricing before enabling live mode. */
  pricingVerified: boolean;
  /** Must bound ALL billed input, including structured-output schema overhead. */
  inputTokenUpperBound(request: ModelRequest, schema: z.ZodType): Promise<number>;
  /** Must enforce the supplied model, token cap and response schema. No internal retries. */
  invoke(request: ModelRequest, schema: z.ZodType): Promise<unknown>;
};

/** Round upward to nanodollars so reservations never round below estimated cost. */
export function pricedCost(inputTokens: number, outputTokens: number, prices: LiveProvider['prices']) {
  return Math.ceil((inputTokens * prices.input + outputTokens * prices.output) * 1000) / 1e9;
}

export async function runGuardedCall<T>(options: {
  call: unknown;
  messages: ModelRequest['messages'];
  schema: z.ZodType<T>;
  inspect: (value: T) => void;
  mockOutput: unknown;
  store: UsageStore;
  provider?: LiveProvider;
}): Promise<T> {
  const parsed = CallSchema.strict().safeParse(options.call);
  if (!parsed.success) throw new GuardrailError('invalid_call_options');
  const call = parsed.data;
  const request: ModelRequest = {
    model: ALLOWED_MODEL, maxOutputTokens: call.maxOutputTokens, messages: options.messages,
  };
  const started = performance.now();
  const entry = UsageLogEntrySchema.parse({
    id: crypto.randomUUID(), userId: call.userId, feature: call.feature,
    model: ALLOWED_MODEL, mode: call.mode, inputTokens: 0, outputTokens: 0,
    latencyMs: 0, costUsd: 0, attempt: call.attempt, ok: false, error: null,
    createdAt: new Date().toISOString(),
  });
  let reservedUsd = 0;
  let inputBound = 0;
  let prices: LiveProvider['prices'] | undefined;
  if (call.mode === 'live') {
    if (!options.provider?.pricingVerified) throw new GuardrailError('live_not_configured');
    prices = PricesSchema.parse(options.provider.prices);
    inputBound = z.number().int().nonnegative().parse(
      await options.provider.inputTokenUpperBound(request, options.schema),
    );
    reservedUsd = pricedCost(inputBound, call.maxOutputTokens, prices);
    if (reservedUsd <= 0 || reservedUsd > MONTHLY_SPEND_LIMIT_USD) {
      throw new GuardrailError('budget_exceeded');
    }
  }
  // Fail closed if persistence is unavailable. The provider has not run yet.
  await options.store.reserve(entry, reservedUsd);
  let usageKnown = call.mode === 'mock';
  let output: T | undefined;
  let failure: GuardrailError | undefined;
  try {
    let value: unknown = options.mockOutput;
    if (call.mode === 'live' && options.provider && prices) {
      const result = ProviderResultSchema.safeParse(await options.provider.invoke(request, options.schema));
      if (!result.success) throw new GuardrailError('provider_usage_unknown');
      entry.inputTokens = result.data.inputTokens;
      entry.outputTokens = result.data.outputTokens;
      entry.costUsd = pricedCost(entry.inputTokens, entry.outputTokens, prices);
      usageKnown = true;
      if (entry.inputTokens > inputBound || entry.outputTokens > call.maxOutputTokens) {
        throw new GuardrailError('provider_token_bound_exceeded');
      }
      value = result.data.output;
    }
    output = checkOutput(options.schema, value, options.inspect);
    entry.ok = true;
  } catch (error) {
    // Never persist provider messages, prompts, output, or raw validation errors.
    const knownCodes = new Set([
      'invalid_output', 'invalid_task_reference', 'instruction_attempt',
      'sensitive_input', 'input_too_long', 'provider_usage_unknown',
      'provider_token_bound_exceeded',
    ]);
    const code = error instanceof GuardrailError && knownCodes.has(error.code)
      ? error.code : 'model_call_failed';
    failure = new GuardrailError(code);
    entry.error = code;
  }
  entry.latencyMs = Math.max(0, Math.round(performance.now() - started));
  await options.store.finish(UsageLogEntrySchema.parse(entry), usageKnown);
  if (failure) throw failure;
  // Successful schema parsing establishes T, even when T itself permits undefined.
  return output as T;
}

export function summarizeUsage(input: unknown, month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new GuardrailError('invalid_month');
  const rows = z.array(UsageLogEntrySchema).parse(input).filter((row) =>
    new Date(row.createdAt).toISOString().slice(0, 7) === month);
  return {
    month,
    calls: rows.length,
    liveCalls: rows.filter((row) => row.mode === 'live').length,
    mockCalls: rows.filter((row) => row.mode === 'mock').length,
    failures: rows.filter((row) => !row.ok).length,
    inputTokens: rows.reduce((total, row) => total + row.inputTokens, 0),
    outputTokens: rows.reduce((total, row) => total + row.outputTokens, 0),
    totalLatencyMs: rows.reduce((total, row) => total + row.latencyMs, 0),
    costUsd: rows.reduce((total, row) => total + row.costUsd, 0),
  };
}
