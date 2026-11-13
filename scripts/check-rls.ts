// Privacy check: "each user sees only their own data" (docs/team-plan.md, Phase 1).
// Signs up two throwaway users against the real project, has A create data, and checks
// that B and a signed-out client cannot read, change, delete, or reference it.
//
//   npm run check:rls
//
// Uses only the public URL + publishable key from .env (never the secret key).
// Each run leaves two "rls-test-*@example.com" users with no data; delete them in the
// dashboard (Authentication > Users) when convenient.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { taskFromRow, type Database } from '@shared';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env');

type Client = SupabaseClient<Database>;
const newClient = (): Client => createClient<Database>(url, key, { auth: { persistSession: false } });

const results: { name: string; ok: boolean; detail?: string }[] = [];
const check = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail });

async function signUp(client: Client, label: string) {
  const email = `rls-test-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = crypto.randomUUID();
  const { data, error } = await client.auth.signUp({ email, password });
  if (error || !data.session) throw new Error(`sign-up ${label} failed: ${error?.message ?? 'no session (is email confirmation on?)'}`);
  return data.session.user.id;
}

async function main() {
  const a = newClient();
  const b = newClient();
  const anon = newClient();
  const aId = await signUp(a, 'a');
  await signUp(b, 'b');

  // A creates a task, a class, and a schedule block.
  const due = new Date(Date.now() + 3 * 86_400_000).toISOString();
  const { data: aTask, error: e1 } = await a
    .from('tasks')
    .insert({ title: 'Synthetic essay (RLS test)', due_at: due, source: 'synthetic' })
    .select()
    .single();
  if (e1 || !aTask) throw new Error(`A insert task failed: ${e1?.message}`);
  check('A can create and read back own task (row maps to shared Task)', taskFromRow(aTask).userId === aId);

  const { error: e2 } = await a.from('class_meetings').insert({
    name: 'Synthetic CS 101', days: ['mon', 'wed'], start_time: '09:00', end_time: '09:50',
    term_start: '2026-08-24', term_end: '2026-12-11',
  });
  check('A can create own class', !e2, e2?.message);

  const start = new Date(Date.now() + 86_400_000);
  const { error: e3 } = await a.from('schedule_blocks').insert({
    task_id: aTask.id, start_at: start.toISOString(), end_at: new Date(start.getTime() + 3_600_000).toISOString(),
    session_index: 1, session_count: 1,
  });
  check('A can create a block for own task', !e3, e3?.message);

  // B must not see or touch any of A's rows.
  for (const table of ['tasks', 'class_meetings', 'schedule_blocks', 'commitments', 'user_preferences', 'usage_log'] as const) {
    const { data, error } = await b.from(table).select('*');
    check(`B sees zero rows in ${table}`, !error && data.length === 0, error?.message ?? `${data?.length} rows`);
  }

  const upd = await b.from('tasks').update({ title: 'hijacked' }).eq('id', aTask.id).select();
  check("B cannot update A's task", !upd.error && upd.data.length === 0, upd.error?.message);

  const del = await b.from('tasks').delete().eq('id', aTask.id).select();
  check("B cannot delete A's task", !del.error && del.data.length === 0, del.error?.message);

  const forged = await b.from('tasks').insert({ title: 'forged', due_at: due, user_id: aId });
  check('B cannot insert a task owned by A', !!forged.error, forged.error ? undefined : 'insert succeeded');

  const bBlock = await b.from('schedule_blocks').insert({
    task_id: aTask.id, start_at: start.toISOString(), end_at: new Date(start.getTime() + 3_600_000).toISOString(),
    session_index: 1, session_count: 1,
  });
  check("B cannot schedule a block on A's task", !!bBlock.error, bBlock.error ? undefined : 'insert succeeded');

  const usage = await b.from('usage_log').insert({
    feature: 'estimate', model: 'x', mode: 'mock', input_tokens: 0, output_tokens: 0, latency_ms: 0, cost_usd: 0, ok: true,
  });
  check('Signed-in users cannot write usage_log', !!usage.error, usage.error ? undefined : 'insert succeeded');

  // Signed-out clients get nothing.
  const anonRead = await anon.from('tasks').select('*');
  check('Signed-out client cannot read tasks', !!anonRead.error || anonRead.data.length === 0, anonRead.error?.message);

  // A's data is untouched; clean up.
  const { data: still } = await a.from('tasks').select('title').eq('id', aTask.id).single();
  check("A's task is unchanged", still?.title === 'Synthetic essay (RLS test)');
  await a.from('tasks').delete().eq('id', aTask.id);
  await a.from('class_meetings').delete().eq('user_id', aId);
  await Promise.all([a.auth.signOut(), b.auth.signOut()]);

  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
