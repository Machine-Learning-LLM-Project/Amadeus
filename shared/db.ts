// Row <-> object mappers between Postgres rows (snake_case, see database.types.ts)
// and the shared Zod types (camelCase). Every *FromRow validates with the Zod schema,
// so a bad row fails loudly instead of leaking a wrong shape into the app.
import type { Tables, TablesInsert } from './database.types.ts';
import { ClassMeetingSchema, type ClassMeeting, type ClassMeetingInput } from './schemas/class-meeting.ts';
import { CommitmentSchema, type Commitment, type CommitmentInput } from './schemas/commitment.ts';
import { UserPreferencesSchema, type UserPreferences } from './schemas/preferences.ts';
import { ScheduleBlockSchema, type ScheduleBlock } from './schemas/schedule.ts';
import { TaskSchema, type Task, type TaskInput } from './schemas/task.ts';

/** Postgres `time` comes back as "HH:MM:SS"; the app uses "HH:MM". */
const hhmm = (t: string) => t.slice(0, 5);

// tasks ---------------------------------------------------------------------

export function taskFromRow(row: Tables<'tasks'>): Task {
  return TaskSchema.parse({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    course: row.course,
    dueAt: row.due_at,
    estimatedMinutes: row.estimated_minutes,
    splittable: row.splittable,
    minSessionMinutes: row.min_session_minutes,
    priority: row.priority,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
  });
}

/** user_id is filled in by the database (defaults to the signed-in user). */
export function taskToInsert(input: TaskInput): TablesInsert<'tasks'> {
  return {
    title: input.title,
    description: input.description,
    course: input.course,
    due_at: input.dueAt,
    estimated_minutes: input.estimatedMinutes,
    splittable: input.splittable,
    min_session_minutes: input.minSessionMinutes,
    priority: input.priority,
    status: input.status,
    source: input.source,
  };
}

// class_meetings ------------------------------------------------------------

export function classMeetingFromRow(row: Tables<'class_meetings'>): ClassMeeting {
  return ClassMeetingSchema.parse({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    location: row.location,
    days: row.days,
    startTime: hhmm(row.start_time),
    endTime: hhmm(row.end_time),
    termStart: row.term_start,
    termEnd: row.term_end,
  });
}

export function classMeetingToInsert(input: ClassMeetingInput): TablesInsert<'class_meetings'> {
  return {
    name: input.name,
    location: input.location,
    days: input.days,
    start_time: input.startTime,
    end_time: input.endTime,
    term_start: input.termStart,
    term_end: input.termEnd,
  };
}

// commitments ---------------------------------------------------------------

export function commitmentFromRow(row: Tables<'commitments'>): Commitment {
  return CommitmentSchema.parse({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    kind: row.kind,
    startAt: row.start_at,
    endAt: row.end_at,
  });
}

export function commitmentToInsert(input: CommitmentInput): TablesInsert<'commitments'> {
  return { title: input.title, kind: input.kind, start_at: input.startAt, end_at: input.endAt };
}

// user_preferences ----------------------------------------------------------

export function preferencesFromRow(row: Tables<'user_preferences'>): UserPreferences {
  return UserPreferencesSchema.parse({
    userId: row.user_id,
    timezone: row.timezone,
    dayStart: hhmm(row.day_start),
    dayEnd: hhmm(row.day_end),
    bufferMinutes: row.buffer_minutes,
    maxSessionMinutes: row.max_session_minutes,
  });
}

export function preferencesToUpsert(prefs: UserPreferences): TablesInsert<'user_preferences'> {
  return {
    user_id: prefs.userId,
    timezone: prefs.timezone,
    day_start: prefs.dayStart,
    day_end: prefs.dayEnd,
    buffer_minutes: prefs.bufferMinutes,
    max_session_minutes: prefs.maxSessionMinutes,
  };
}

// schedule_blocks -----------------------------------------------------------

export function scheduleBlockFromRow(row: Tables<'schedule_blocks'>): ScheduleBlock {
  return ScheduleBlockSchema.parse({
    id: row.id,
    taskId: row.task_id,
    start: row.start_at,
    end: row.end_at,
    sessionIndex: row.session_index,
    sessionCount: row.session_count,
    status: row.status,
    aiGenerated: row.ai_generated,
  });
}

export function scheduleBlockToInsert(block: Omit<ScheduleBlock, 'id'>): TablesInsert<'schedule_blocks'> {
  return {
    task_id: block.taskId,
    start_at: block.start,
    end_at: block.end,
    session_index: block.sessionIndex,
    session_count: block.sessionCount,
    status: block.status,
    ai_generated: block.aiGenerated,
  };
}
