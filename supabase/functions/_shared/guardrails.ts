import { z } from 'zod';

import { TaskSchema, type Task } from '../../../shared/schemas/task.ts';

export class GuardrailError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = 'GuardrailError';
  }
}

const TasksSchema = z.array(TaskSchema.strict()).max(100);
const instructionPatterns = [
  /ignore\s+(?:all\s+|your\s+|previous\s+|the\s+)*instructions/i,
  /(?:delete|drop|erase)\s+(?:all\s+)?tasks/i,
  /(?:reveal|show|print|expose)\b.{0,60}(?:system\s+prompt|api\s*key|secret)/i,
  /(?:system|assistant|developer)\s*:|<\/?(?:system|assistant|developer)>/i,
];

/** Defense in depth only: pattern matching cannot recognize every injection. */
export function checkText(text: string): void {
  if (text.length > 32_000) throw new GuardrailError('input_too_long');
  if (instructionPatterns.some((pattern) => pattern.test(text))) {
    throw new GuardrailError('instruction_attempt');
  }
  if (
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text) ||
    /\b(?:student\s*id|ssn)\s*[:#]?\s*\d{4,}/i.test(text) ||
    /(?:\+?\d[\s().-]*){10,}/.test(text) ||
    /\b(?:sk-|sb_secret_)[\w-]{10,}/.test(text)
  ) {
    throw new GuardrailError('sensitive_input');
  }
}

/** userId must come from verified authentication, never from the request body. */
export function checkTasks(input: unknown, userId: string): Task[] {
  const parsed = TasksSchema.safeParse(input);
  if (!parsed.success) throw new GuardrailError('invalid_tasks');
  for (const task of parsed.data) {
    if (task.userId !== userId) throw new GuardrailError('foreign_user_data');
    checkText([task.title, task.description ?? '', task.course ?? ''].join('\n'));
  }
  if (new Set(parsed.data.map((task) => task.id)).size !== parsed.data.length) {
    throw new GuardrailError('duplicate_task');
  }
  // Check only free text: timestamps and UUIDs are not personal phone numbers.
  if (parsed.data.reduce((size, task) => size + task.title.length +
    (task.description?.length ?? 0) + (task.course?.length ?? 0), 0) > 32_000) {
    throw new GuardrailError('input_too_long');
  }
  return parsed.data;
}

/** Validate shape, then references/content. Never return raw Zod errors to clients. */
export function checkOutput<T>(schema: z.ZodType<T>, value: unknown, inspect: (data: T) => void): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new GuardrailError('invalid_output');
  inspect(parsed.data);
  return parsed.data;
}

export function checkTaskReferences(ids: string[], allowedIds: ReadonlySet<string>): void {
  if (ids.some((id) => !allowedIds.has(id)) || new Set(ids).size !== ids.length) {
    throw new GuardrailError('invalid_task_reference');
  }
}
