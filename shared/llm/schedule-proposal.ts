// DRAFT. TODO(Gilberto): loop outputs (explanations, adjustments). TODO(Kadin): baseline output.
// OpenAI strict structured outputs need every field present: use .nullable(), never .optional().
import { z } from 'zod';

/** A suggested change after deadlines or plans change. The user accepts or rejects each one. */
export const ScheduleChangeSchema = z.object({
  action: z.enum(['move', 'shorten', 'split', 'drop']),
  taskId: z.string(),
  /** New start time for "move", otherwise null. ISO 8601 with offset. */
  newStart: z.string().nullable(),
  /** New length for "shorten", otherwise null. */
  newMinutes: z.number().int().min(1).nullable(),
  reason: z.string().max(300),
});

/** Natural-language explanation of the final (checked) schedule. */
export const ScheduleExplanationSchema = z.object({
  summary: z.string().max(800),
  changes: z.array(ScheduleChangeSchema),
});

/** Baseline: the LLM writes the whole schedule in one step, with no scheduler or checker. */
export const BaselineScheduleSchema = z.object({
  blocks: z.array(
    z.object({
      taskId: z.string(),
      start: z.string(),
      end: z.string(),
    }),
  ),
});

export type ScheduleChange = z.infer<typeof ScheduleChangeSchema>;
export type ScheduleExplanation = z.infer<typeof ScheduleExplanationSchema>;
export type BaselineSchedule = z.infer<typeof BaselineScheduleSchema>;
