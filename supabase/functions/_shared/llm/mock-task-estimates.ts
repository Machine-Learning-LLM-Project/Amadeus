import type { TaskEstimatesResponse } from '../../../../shared/llm/task-estimate.ts';
import { TaskSchema, type Task } from '../../../../shared/schemas/task.ts';

import { getMockTaskScenarios } from './mock-task-scenarios.ts';

/** Server-side fixture lookup. No model call or task updates are performed. */
export function getMockTaskEstimates(tasks: readonly Task[]): TaskEstimatesResponse {
  const parsedTasks = TaskSchema.array().parse(tasks);
  const taskFields = Object.keys(TaskSchema.shape) as (keyof Task)[];
  const scenario = getMockTaskScenarios().find((candidate) => (
    candidate.tasks.length === parsedTasks.length &&
    candidate.tasks.every((expected) => parsedTasks.some((task) => (
      taskFields.every((field) => task[field] === expected[field])
    )))
  ));

  if (!scenario) {
    throw new Error('Unsupported mock task inputs. Supply a complete, unchanged task set from getMockTaskScenarios().');
  }

  return scenario.response;
}
