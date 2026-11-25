import { UsageLogEntrySchema } from '../../../shared/schemas/usage.ts';
import { GuardrailError } from './guardrails.ts';
import type { UsageStore } from './usage.ts';

/** Pass a server-created Supabase service client. Never use the user's client. */
export type UsageRpcClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{
    data: unknown;
    error: unknown;
  }>;
};

export function createUsageStore(client: UsageRpcClient): UsageStore {
  return {
    async reserve(entry, reservedUsd) {
      const { data, error } = await client.rpc('reserve_llm_usage', {
        p_entry: UsageLogEntrySchema.parse(entry), p_reserved_usd: reservedUsd,
      });
      if (error) throw new GuardrailError('usage_store_unavailable');
      if (data === false) throw new GuardrailError('budget_exceeded');
      if (data !== true) throw new GuardrailError('usage_store_unavailable');
    },
    async finish(entry, usageKnown) {
      const { data, error } = await client.rpc('finish_llm_usage', {
        p_entry: UsageLogEntrySchema.parse(entry), p_usage_known: usageKnown,
      });
      if (error || data !== true) throw new GuardrailError('usage_store_unavailable');
    },
  };
}
