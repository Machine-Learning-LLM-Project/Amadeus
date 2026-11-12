import { z } from 'zod';

import { IdSchema, IsoDateTimeSchema, MinutesSchema } from './common.ts';

export const TaskStatusSchema = z.enum(['todo', 'scheduled', 'done', 'dropped']);
export const TaskSourceSchema = z.enum(['manual', 'canvas', 'synthetic']);

/** Something the student has to get done before a deadline (assignment, study session, goal). */
export const TaskSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullable(),
  course: z.string().max(100).nullable(),
  dueAt: IsoDateTimeSchema,
  /** Null until the user or the LLM provides an estimate. */
  estimatedMinutes: MinutesSchema.nullable(),
  /** Whether the scheduler may split this task into several sessions. */
  splittable: z.boolean(),
  /** Shortest session worth scheduling when split. Null = use the user's default. */
  minSessionMinutes: MinutesSchema.nullable(),
  /** 1 = highest priority. Null until ranked. */
  priority: z.number().int().min(1).max(5).nullable(),
  status: TaskStatusSchema,
  source: TaskSourceSchema,
  createdAt: IsoDateTimeSchema,
});

/** Shape of the add/edit task form. Ids and timestamps are assigned by the backend. */
export const TaskInputSchema = TaskSchema.omit({ id: true, userId: true, createdAt: true });

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskSource = z.infer<typeof TaskSourceSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TaskInput = z.infer<typeof TaskInputSchema>;
