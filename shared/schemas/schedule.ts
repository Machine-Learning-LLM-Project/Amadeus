import { z } from 'zod';

import { IdSchema, IsoDateTimeSchema } from './common.ts';

export const BlockStatusSchema = z.enum(['proposed', 'accepted', 'rejected']);

/** One placed work session for a task. A task split into 3 sessions yields 3 blocks. */
export const ScheduleBlockSchema = z.object({
  id: IdSchema,
  taskId: IdSchema,
  start: IsoDateTimeSchema,
  end: IsoDateTimeSchema,
  /** 1-based position of this session among the task's sessions. */
  sessionIndex: z.number().int().min(1),
  sessionCount: z.number().int().min(1),
  status: BlockStatusSchema,
  /** True when the block came from an AI suggestion (the UI must label these). */
  aiGenerated: z.boolean(),
});

export const ScheduleSchema = z.object({
  userId: IdSchema,
  generatedAt: IsoDateTimeSchema,
  blocks: z.array(ScheduleBlockSchema),
  /** Human-readable notes, e.g. "Not enough time before CS 101 essay deadline". */
  warnings: z.array(z.string()),
});

/**
 * Rule breaks found by the schedule checker. The main eval metric is the share of
 * schedules with zero violations of kind overlap, missed_deadline, or class_conflict.
 */
export const ViolationKindSchema = z.enum([
  'overlap',
  'missed_deadline',
  'class_conflict',
  'commitment_conflict',
  'outside_hours',
]);

export const ViolationSchema = z.object({
  kind: ViolationKindSchema,
  blockIds: z.array(IdSchema),
  message: z.string(),
});

export const CheckResultSchema = z.object({
  ok: z.boolean(),
  violations: z.array(ViolationSchema),
});

export type BlockStatus = z.infer<typeof BlockStatusSchema>;
export type ScheduleBlock = z.infer<typeof ScheduleBlockSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type ViolationKind = z.infer<typeof ViolationKindSchema>;
export type Violation = z.infer<typeof ViolationSchema>;
export type CheckResult = z.infer<typeof CheckResultSchema>;
