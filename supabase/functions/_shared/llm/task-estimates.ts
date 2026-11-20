import type { TaskEstimatesResponse } from '../../../../shared/llm/task-estimate.ts';
import type { Task } from '../../../../shared/schemas/task.ts';
import { LlmModeSchema } from '../../../../shared/schemas/usage.ts';

import { getMockTaskEstimates } from './mock-task-estimates.ts';

/** Pass the server's LLM_MODE value. Unset or empty configuration selects mock. */
export function getTaskEstimates(tasks: readonly Task[], mode?: string): TaskEstimatesResponse {
  const result = LlmModeSchema.safeParse(mode === undefined || mode === '' ? 'mock' : mode);
  if (!result.success) {
    throw new Error('Unsupported LLM_MODE. Expected "mock" or "live".');
  }
  if (result.data === 'live') {
    throw new Error('LLM_MODE=live is unavailable: the live task-estimate provider has not been implemented.');
  }

  return getMockTaskEstimates(tasks);
}
