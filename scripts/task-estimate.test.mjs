import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';

import {
  TaskEstimatesResponseSchema,
  validateTaskEstimatesResponse,
} from '../shared/llm/task-estimate.ts';
import { TaskSchema } from '../shared/schemas/task.ts';

const tasks = ['synthetic-task-1', 'synthetic-task-2'].map((id) => TaskSchema.parse({
  id,
  userId: 'synthetic-student-1',
  title: 'Fictional assignment',
  description: null,
  course: null,
  dueAt: '2026-11-22T18:00:00-07:00',
  estimatedMinutes: null,
  splittable: true,
  minSessionMinutes: 20,
  priority: null,
  status: 'todo',
  source: 'synthetic',
  createdAt: '2026-11-20T08:00:00-07:00',
}));
const limits = { maxSessionMinutes: 90, defaultMinSessionMinutes: null };

function response() {
  return {
    estimates: tasks.map((task, index) => ({
      taskId: task.id,
      estimatedMinutes: 60,
      sessionMinutes: [30, 30],
      priorityRank: index + 1,
      rationale: 'Synthetic test estimate.',
    })),
  };
}

function rejects(input, expectedPath, suppliedTasks = tasks, suppliedLimits = limits) {
  assert.throws(
    () => validateTaskEstimatesResponse(input, suppliedTasks, suppliedLimits),
    (error) => error instanceof z.ZodError && error.issues.some(
      (issue) => JSON.stringify(issue.path) === JSON.stringify(expectedPath),
    ),
  );
}

test('accepts valid estimates without changing their fields or the supplied tasks', () => {
  const input = response();
  const originalTasks = structuredClone(tasks);
  assert.deepEqual(validateTaskEstimatesResponse(input, tasks, limits), input);
  assert.deepEqual(tasks, originalTasks);
});

test('ordering is determined by rank, not response array position', () => {
  const input = response();
  input.estimates.reverse();
  assert.deepEqual(validateTaskEstimatesResponse(input, tasks, limits), input);
});

test('accepts an empty response only for an empty task list', () => {
  assert.deepEqual(validateTaskEstimatesResponse({ estimates: [] }, [], limits), { estimates: [] });
  rejects({ estimates: [] }, ['estimates']);
  rejects(response(), ['estimates', 0, 'taskId'], []);
});

test('rejects invalid durations and session lengths', () => {
  for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '30', null]) {
    const input = response();
    input.estimates[0].estimatedMinutes = value;
    rejects(input, ['estimates', 0, 'estimatedMinutes']);
    input.estimates[0] = response().estimates[0];
    input.estimates[0].sessionMinutes = [value];
    rejects(input, ['estimates', 0, 'sessionMinutes', 0]);
  }
});

test('rejects empty sessions in the base schema', () => {
  const input = response();
  input.estimates[0].sessionMinutes = [];
  assert.equal(TaskEstimatesResponseSchema.safeParse(input).success, false);
  rejects(input, ['estimates', 0, 'sessionMinutes']);
});

test('rejects inconsistent session totals', () => {
  const input = response();
  input.estimates[0].estimatedMinutes = 61;
  rejects(input, ['estimates', 0, 'sessionMinutes']);
});

test('rejects duplicate, missing, and unknown response task IDs', () => {
  const duplicate = response();
  duplicate.estimates[1].taskId = tasks[0].id;
  rejects(duplicate, ['estimates', 1, 'taskId']);
  rejects(duplicate, ['estimates']);
  const missing = response();
  missing.estimates.pop();
  rejects(missing, ['estimates']);
  const unknown = response();
  unknown.estimates[0].taskId = 'unknown-task';
  rejects(unknown, ['estimates', 0, 'taskId']);
});

test('rejects duplicate IDs in the supplied tasks', () => {
  rejects(response(), ['tasks', 1, 'id'], [tasks[0], tasks[0]]);
});

test('rejects duplicate, gapped, and invalid priority ranks', () => {
  const duplicate = response();
  duplicate.estimates[1].priorityRank = 1;
  rejects(duplicate, ['estimates', 1, 'priorityRank']);
  for (const rank of [0, -1, 1.5, 3, 4]) {
    const input = response();
    input.estimates[1].priorityRank = rank;
    rejects(input, ['estimates', 1, 'priorityRank']);
  }
});

test('ranks beyond 5 remain valid for larger task lists', () => {
  const suppliedTasks = Array.from({ length: 6 }, (_, index) => ({ ...tasks[0], id: `synthetic-task-${index + 1}` }));
  const input = {
    estimates: suppliedTasks.map((task, index) => ({ ...response().estimates[0], taskId: task.id, priorityRank: index + 1 })),
  };
  assert.deepEqual(validateTaskEstimatesResponse(input, suppliedTasks, limits), input);
  assert.equal(suppliedTasks[5].priority, null);
});

test('rejects splitting a nonsplittable task', () => {
  rejects(response(), ['estimates', 0, 'sessionMinutes'], [{ ...tasks[0], splittable: false }, tasks[1]]);
});

test('allows short unsplit tasks without a resolved minimum', () => {
  const input = response();
  input.estimates[0].estimatedMinutes = 10;
  input.estimates[0].sessionMinutes = [10];
  const suppliedTasks = [{ ...tasks[0], splittable: false, minSessionMinutes: null }, tasks[1]];
  assert.deepEqual(validateTaskEstimatesResponse(input, suppliedTasks, limits), input);
});

test('enforces the maximum for both split and unsplit sessions', () => {
  for (const sessions of [[91], [91, 30]]) {
    const input = response();
    input.estimates[0].sessionMinutes = sessions;
    input.estimates[0].estimatedMinutes = sessions.reduce((total, minutes) => total + minutes, 0);
    rejects(input, ['estimates', 0, 'sessionMinutes', 0]);
  }
  const input = response();
  input.estimates[0].sessionMinutes = [90];
  input.estimates[0].estimatedMinutes = 90;
  assert.deepEqual(validateTaskEstimatesResponse(input, tasks, limits), input);
});

test('enforces the task minimum for every split session, including the remainder', () => {
  const input = response();
  input.estimates[0].sessionMinutes = [41, 19];
  rejects(input, ['estimates', 0, 'sessionMinutes', 1]);
  input.estimates[0].sessionMinutes = [40, 20];
  assert.deepEqual(validateTaskEstimatesResponse(input, tasks, limits), input);
});

test('uses the caller minimum only when the task minimum is null', () => {
  const suppliedTasks = [{ ...tasks[0], minSessionMinutes: null }, tasks[1]];
  assert.deepEqual(validateTaskEstimatesResponse(response(), suppliedTasks, { ...limits, defaultMinSessionMinutes: 30 }), response());
  rejects(response(), ['estimates', 0, 'sessionMinutes', 0], suppliedTasks, { ...limits, defaultMinSessionMinutes: 31 });
  assert.deepEqual(validateTaskEstimatesResponse(response(), tasks, { ...limits, defaultMinSessionMinutes: 40 }), response());
});

test('rejects split tasks whose minimum cannot be resolved', () => {
  rejects(response(), ['estimates', 0, 'sessionMinutes'], [{ ...tasks[0], minSessionMinutes: null }, tasks[1]]);
});

test('validates caller limits instead of silently skipping constraints', () => {
  for (const value of [0, 14, 481, 90.5, NaN, undefined]) {
    rejects(response(), ['maxSessionMinutes'], tasks, { ...limits, maxSessionMinutes: value });
  }
  for (const value of [0, -1, 1.5, NaN, undefined]) {
    rejects(response(), ['defaultMinSessionMinutes'], tasks, { ...limits, defaultMinSessionMinutes: value });
  }
});

test('base schemas remain composable and emit required structured output fields', () => {
  assert.ok(TaskEstimatesResponseSchema.omit({ estimates: true }).safeParse({}).success);
  const schema = z.toJSONSchema(TaskEstimatesResponseSchema);
  assert.deepEqual(schema.required, ['estimates']);
  assert.equal(schema.additionalProperties, false);
  const estimateSchema = schema.properties.estimates.items;
  assert.deepEqual(estimateSchema.required, ['taskId', 'estimatedMinutes', 'sessionMinutes', 'priorityRank', 'rationale']);
  assert.equal(estimateSchema.additionalProperties, false);
});
