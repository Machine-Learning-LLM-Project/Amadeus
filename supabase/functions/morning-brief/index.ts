import { createClient } from '@supabase/supabase-js';
import { scheduleBlockFromRow, taskFromRow } from '../../../shared/db.ts';
import type { Database } from '../../../shared/database.types.ts';
import { generateMorningBrief } from '../_shared/brief-service.ts';
import { GuardrailError } from '../_shared/guardrails.ts';
import { createUsageStore } from '../_shared/usage-store.ts';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-planner-timezone',
  'Cache-Control': 'no-store',
};
const reply = (status: number, data: unknown) => Response.json(data, { status, headers });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply(405, { error: 'POST required' });
  // No request payload: all student records come from the verified session.
  const authorization = req.headers.get('authorization') ?? '';
  const token = /^Bearer (\S+)$/i.exec(authorization)?.[1];
  if (!token) return reply(401, { error: 'Sign in required' });
  if (req.body) {
    for await (const chunk of req.body) {
      if (chunk.byteLength > 0) return reply(400, { error: 'Unexpected body' });
    }
  }
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const options = { auth: { persistSession: false, autoRefreshToken: false } };
    const student = createClient<Database>(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      ...options, global: { headers: { Authorization: authorization } },
    });
    const { data: { user }, error } = await student.auth.getUser(token);
    if (error || !user) return reply(401, { error: 'Sign in required' });

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, options);
    const recent = await admin.from('llm_usage_log').select('id', { head: true, count: 'exact' })
      .eq('user_id', user.id).eq('feature', 'brief').gte('created_at', new Date(Date.now() - 60000).toISOString()).throwOnError();
    if ((recent.count ?? 0) >= 3) return reply(429, { error: 'Try again in a minute' });
    const [tasks, prefs] = await Promise.all([
      student.from('tasks').select('*').in('status', ['todo', 'scheduled']).limit(101).throwOnError(),
      student.from('user_preferences').select('timezone').maybeSingle().throwOnError(),
    ]);
    const timezone = prefs.data?.timezone ?? req.headers.get('x-planner-timezone') ?? 'UTC';
    if (timezone.length > 100) return reply(400, { error: 'Invalid timezone' });
    let dayFormat: Intl.DateTimeFormat;
    try { dayFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: timezone }); }
    catch { return reply(400, { error: 'Invalid timezone' }); }
    const now = new Date();
    // Every local day's UTC bounds fall within this window. The brief helper filters by local date.
    const date = dayFormat.format(now);
    const noon = Date.parse(date + 'T12:00:00Z');
    const blocks = await student.from('schedule_blocks').select('*').eq('status', 'accepted')
      .gte('start_at', new Date(noon - 36 * 3600000).toISOString())
      .lt('start_at', new Date(noon + 36 * 3600000).toISOString()).throwOnError();
    const ids = new Set(tasks.data.map(t => t.id));
    const result = await generateMorningBrief({
      authenticatedUserId: user.id, store: createUsageStore(admin),
      context: { date, timezone, tasks: tasks.data.map(taskFromRow), schedule: {
        userId: user.id, generatedAt: now.toISOString(), warnings: [],
        blocks: blocks.data.filter(b => ids.has(b.task_id)).map(scheduleBlockFromRow),
      } },
    });
    return reply(200, result);
  } catch (error) {
    return error instanceof GuardrailError && ['instruction_attempt', 'input_too_long', 'sensitive_input'].includes(error.code)
      ? reply(422, { error: 'Brief input could not be used' })
      : reply(503, { error: 'Brief unavailable' });
  }
});
