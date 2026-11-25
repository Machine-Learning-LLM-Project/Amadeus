import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import { UsageLogEntrySchema } from '../../shared/schemas/usage.ts';
import { summarizeUsage } from '../../supabase/functions/_shared/usage.ts';

// Accept a JSON export of llm_usage_log from an admin session. Never load .env.
try {
  const [file, month] = process.argv.slice(2);
  if (!file || path.extname(file) !== '.json' || !month) throw new Error('arguments');
  const raw = z.array(z.record(z.string(), z.unknown())).parse(JSON.parse(readFileSync(file, 'utf8')));
  const rows = raw.map((row) => UsageLogEntrySchema.parse({
    id: row.id, userId: row.user_id, feature: row.feature, model: row.model,
    mode: row.mode, inputTokens: row.input_tokens, outputTokens: row.output_tokens,
    latencyMs: row.latency_ms, costUsd: Number(row.cost_usd), attempt: row.attempt,
    ok: row.ok, error: row.error, createdAt: row.created_at,
  }));
  const summary = summarizeUsage(rows, month);
  // Holds survive month changes until usage is reconciled. They are not spent cost.
  const reservedUsd = raw.reduce((sum, row) => sum + z.coerce.number().nonnegative().parse(row.reserved_usd), 0);
  const unresolvedCalls = raw.filter((row) => !row.completed || !row.usage_known).length;
  console.log(JSON.stringify({ ...summary, reservedUsd, unresolvedCalls,
    remainingUsd: Math.max(0, 8 - summary.costUsd - reservedUsd) }, null, 2));
} catch {
  console.error('Usage: npm run usage:summary -- <database-export.json> YYYY-MM. Export must contain valid usage rows.');
  process.exitCode = 1;
}
