import type { UsageLogEntry } from '../../shared/schemas/usage.ts';
import { GuardrailError } from '../../supabase/functions/_shared/guardrails.ts';
import type { UsageStore } from '../../supabase/functions/_shared/usage.ts';

/** Tests only. Production MUST use the database-backed store across requests. */
export class MemoryUsageStore implements UsageStore {
  readonly rows = new Map<string, UsageLogEntry>();
  readonly reservations = new Map<string, number>();
  readonly completed = new Set<string>();

  async reserve(entry: UsageLogEntry, reservedUsd: number) {
    const month = new Date(entry.createdAt).toISOString().slice(0, 7);
    const spent = [...this.rows.values()].filter((row) =>
      new Date(row.createdAt).toISOString().slice(0, 7) === month)
      .reduce((sum, row) => sum + Math.round(row.costUsd * 1e9), 0);
    const held = [...this.reservations.values()].reduce((sum, usd) => sum + Math.round(usd * 1e9), 0);
    if (entry.mode === 'live' && spent + held + Math.round(reservedUsd * 1e9) > 8e9) {
      throw new GuardrailError('budget_exceeded');
    }
    if (this.rows.has(entry.id)) throw new Error('duplicate_usage');
    this.rows.set(entry.id, structuredClone(entry));
    this.reservations.set(entry.id, reservedUsd);
  }

  async finish(entry: UsageLogEntry, usageKnown: boolean) {
    if (!this.rows.has(entry.id) || this.completed.has(entry.id)) throw new Error('unknown_or_finished_usage');
    this.rows.set(entry.id, structuredClone(entry));
    this.completed.add(entry.id);
    if (usageKnown) this.reservations.delete(entry.id);
  }
}
