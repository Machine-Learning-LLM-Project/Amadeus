// Typed data access for the screens. RLS guarantees each call only sees the signed-in
// user's rows, so there is no user_id filtering here.
import {
  classMeetingFromRow,
  classMeetingToInsert,
  taskFromRow,
  taskToInsert,
  type ClassMeeting,
  type ClassMeetingInput,
  type Task,
  type TaskInput,
} from '@shared';

import { supabase } from '@/lib/supabase';

export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*').order('due_at');
  if (error) throw error;
  return data.map(taskFromRow);
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data, error } = await supabase.from('tasks').insert(taskToInsert(input)).select().single();
  if (error) throw error;
  return taskFromRow(data);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function listClassMeetings(): Promise<ClassMeeting[]> {
  const { data, error } = await supabase.from('class_meetings').select('*').order('start_time');
  if (error) throw error;
  return data.map(classMeetingFromRow);
}

export async function createClassMeeting(input: ClassMeetingInput): Promise<ClassMeeting> {
  const { data, error } = await supabase
    .from('class_meetings')
    .insert(classMeetingToInsert(input))
    .select()
    .single();
  if (error) throw error;
  return classMeetingFromRow(data);
}

export async function deleteClassMeeting(id: string): Promise<void> {
  const { error } = await supabase.from('class_meetings').delete().eq('id', id);
  if (error) throw error;
}
