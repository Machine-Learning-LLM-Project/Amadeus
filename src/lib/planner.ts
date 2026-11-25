import { commitmentFromRow, scheduleBlockFromRow } from '@shared';
import { listClassMeetings, listTasks } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export async function readPlanner() {
  const [tasks, classes, commitments, blocks, preferences] = await Promise.all([
    listTasks(), listClassMeetings(),
    supabase.from('commitments').select('*').throwOnError(),
    supabase.from('schedule_blocks').select('*').neq('status', 'rejected').throwOnError(),
    supabase.from('user_preferences').select('timezone').maybeSingle().throwOnError(),
  ]);
  const timezone = preferences.data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = Date.now();
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: timezone }).format(now);
  return { tasks, classes, commitments: commitments.data.map(commitmentFromRow),
    blocks: blocks.data.map(scheduleBlockFromRow), timezone, today, now };
}

export type Planner = Awaited<ReturnType<typeof readPlanner>>;

export async function decideBlock(id: string, status: 'accepted' | 'rejected') {
  // Only the first decision wins if the same proposal is open on two devices.
  const { data, error } = await supabase.from('schedule_blocks').update({ status })
    .eq('id', id).eq('status', 'proposed').select('id').maybeSingle();
  if (error) throw error;
  return data !== null;
}
