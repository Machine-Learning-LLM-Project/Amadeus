// OpenAI strict structured outputs need every field present: use .nullable(), never .optional().
// Prefer .min()/.max() over .positive() so the generated JSON Schema stays simple.
import { z } from 'zod';

import { IdSchema } from '../schemas/common.ts';
import { UserPreferencesSchema } from '../schemas/preferences.ts';
import type { Task } from '../schemas/task.ts';

export const TaskEstimateSchema = z.object({
  taskId: IdSchema,
  estimatedMinutes: z.number().int().min(1),
  /** Suggested session lengths in minutes; one entry if the task should not be split. */
  sessionMinutes: z.array(z.number().int().min(1)).min(1),
  /** 1 = do first. A complete ordering, independent of Task.priority (1–5). */
  priorityRank: z.number().int().min(1),
  rationale: z.string().max(500),
});

export const TaskEstimatesResponseSchema = z.object({
  estimates: z.array(TaskEstimateSchema),
});

export type TaskEstimate = z.infer<typeof TaskEstimateSchema>;
export type TaskEstimatesResponse = z.infer<typeof TaskEstimatesResponseSchema>;

/** Caller-supplied limits, not part of the model's structured output. */
export const TaskEstimateLimitsSchema = z.object({
  maxSessionMinutes: UserPreferencesSchema.shape.maxSessionMinutes.removeDefault(),
  /** No project-wide default exists yet. Null means the default is unresolved. */
  defaultMinSessionMinutes: z.number().int().min(1).nullable(),
});

export type TaskEstimateLimits = z.infer<typeof TaskEstimateLimitsSchema>;

/**
 * Parse model output, then check it against already-validated tasks and session limits.
 * Throws a ZodError with field paths for invalid output or inconsistent context.
 * A task minimum applies only when split; the maximum applies to every session.
 */
export function validateTaskEstimatesResponse(
  input: unknown,
  tasks: readonly Task[],
  limits: TaskEstimateLimits,
): TaskEstimatesResponse {
  const response = TaskEstimatesResponseSchema.parse(input);
  const { maxSessionMinutes, defaultMinSessionMinutes } = TaskEstimateLimitsSchema.parse(limits);
  const issues: z.core.$ZodIssue[] = [];
  const addIssue = (path: (string | number)[], message: string) => {
    issues.push({ code: 'custom', path, message });
  };

  const tasksById = new Map<string, Task>();
  tasks.forEach((task, index) => {
    if (tasksById.has(task.id)) {
      addIssue(['tasks', index, 'id'], 'Supplied task IDs must be unique.');
    }
    tasksById.set(task.id, task);
  });

  const taskIds = new Set<string>();
  const ranks = new Set<number>();
  response.estimates.forEach((estimate, index) => {
    const path = ['estimates', index];
    if (taskIds.has(estimate.taskId)) {
      addIssue([...path, 'taskId'], 'Each task must have exactly one estimate.');
    }
    taskIds.add(estimate.taskId);

    if (ranks.has(estimate.priorityRank)) {
      addIssue([...path, 'priorityRank'], 'Priority ranks must be unique.');
    }
    ranks.add(estimate.priorityRank);
    if (estimate.priorityRank > tasks.length) {
      addIssue([...path, 'priorityRank'], 'Priority ranks must form a complete ordering from 1 to the task count.');
    }

    const totalMinutes = estimate.sessionMinutes.reduce((total, minutes) => total + minutes, 0);
    if (totalMinutes !== estimate.estimatedMinutes) {
      addIssue([...path, 'sessionMinutes'], 'Session lengths must sum to estimatedMinutes.');
    }
    estimate.sessionMinutes.forEach((minutes, sessionIndex) => {
      if (minutes > maxSessionMinutes) {
        addIssue([...path, 'sessionMinutes', sessionIndex], 'Session exceeds maxSessionMinutes.');
      }
    });

    const task = tasksById.get(estimate.taskId);
    if (!task) {
      addIssue([...path, 'taskId'], 'Estimate refers to an unknown task.');
      return;
    }
    if (estimate.sessionMinutes.length > 1) {
      if (!task.splittable) {
        addIssue([...path, 'sessionMinutes'], 'This task cannot be split.');
      }
      const minSessionMinutes = task.minSessionMinutes ?? defaultMinSessionMinutes;
      if (minSessionMinutes === null) {
        addIssue([...path, 'sessionMinutes'], 'A minimum session length must be supplied for split tasks.');
      } else {
        estimate.sessionMinutes.forEach((minutes, sessionIndex) => {
          if (minutes < minSessionMinutes) {
            addIssue([...path, 'sessionMinutes', sessionIndex], 'Split session is shorter than the minimum session length.');
          }
        });
      }
    }
  });

  tasks.forEach((task) => {
    if (!taskIds.has(task.id)) {
      addIssue(['estimates'], `Missing estimate for task ${task.id}.`);
    }
  });

  if (issues.length > 0) throw new z.ZodError(issues);
  return response;
}
