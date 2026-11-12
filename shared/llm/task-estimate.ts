// DRAFT. TODO(Gilberto): owner of LLM schemas; revise freely.
// OpenAI strict structured outputs need every field present: use .nullable(), never .optional().
// Prefer .min()/.max() over .positive() so the generated JSON Schema stays simple.
import { z } from 'zod';

export const TaskEstimateSchema = z.object({
  taskId: z.string(),
  estimatedMinutes: z.number().int().min(1),
  /** Suggested session lengths in minutes; one entry if the task should not be split. */
  sessionMinutes: z.array(z.number().int().min(1)),
  /** 1 = do first. */
  priorityRank: z.number().int().min(1),
  rationale: z.string().max(500),
});

export const TaskEstimatesResponseSchema = z.object({
  estimates: z.array(TaskEstimateSchema),
});

export type TaskEstimate = z.infer<typeof TaskEstimateSchema>;
export type TaskEstimatesResponse = z.infer<typeof TaskEstimatesResponseSchema>;
