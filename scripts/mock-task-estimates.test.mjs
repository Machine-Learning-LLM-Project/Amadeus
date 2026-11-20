import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

import { TaskEstimatesResponseSchema } from '../shared/llm/task-estimate.ts';
import { getMockTaskEstimates } from '../supabase/functions/_shared/llm/mock-task-estimates.ts';
import { getMockTaskScenarios } from '../supabase/functions/_shared/llm/mock-task-scenarios.ts';
import { getTaskEstimates } from '../supabase/functions/_shared/llm/task-estimates.ts';

for (const scenario of getMockTaskScenarios()) {
  test(`returns the predefined schema-valid response for ${scenario.name}`, () => {
    const originalTasks = structuredClone(scenario.tasks);
    const response = getMockTaskEstimates(scenario.tasks);
    assert.deepEqual(TaskEstimatesResponseSchema.parse(response), scenario.response);
    assert.deepEqual(scenario.tasks, originalTasks);
    assert.ok(scenario.tasks.every((task) => task.priority === null));
    assert.deepEqual(response.estimates.map((estimate) => estimate.taskId).sort(), scenario.tasks.map((task) => task.id).sort());
  });
}

test('repeated calls and reordered task sets produce the same response', () => {
  const scenario = getMockTaskScenarios()[0];
  assert.deepEqual(getMockTaskEstimates(scenario.tasks), getMockTaskEstimates(structuredClone(scenario.tasks)));
  assert.deepEqual(getMockTaskEstimates([...scenario.tasks].reverse()), scenario.response);
});

test('changed, unknown, missing, extra, duplicate, and empty task sets are unsupported', () => {
  const [first, second] = getMockTaskScenarios();
  const unsupported = [
    [],
    [first.tasks[0]],
    [...first.tasks, second.tasks[0]],
    [first.tasks[0], first.tasks[0]],
    [first.tasks[0], { ...first.tasks[1], id: 'unknown-task' }],
  ];
  for (const tasks of unsupported) {
    assert.throws(() => getMockTaskEstimates(tasks), /Unsupported mock task inputs/);
  }
  // Reusing a fixture ID must not hide changed task details.
  for (const changes of [
    { title: 'Changed title' },
    { description: 'Changed description' },
    { dueAt: '2026-11-23T18:00:00-07:00' },
    { splittable: false },
    { minSessionMinutes: 90 },
    { userId: 'another-synthetic-student' },
    { priority: 5 },
  ]) {
    assert.throws(() => getMockTaskEstimates([first.tasks[0], { ...first.tasks[1], ...changes }]), /Unsupported mock task inputs/);
  }
});

test('malformed task input is rejected by the existing task schema', () => {
  assert.throws(() => getMockTaskEstimates([{ id: 'mock-review' }]), { name: 'ZodError' });
});

test('mutating a response or a fixture cannot change subsequent results', () => {
  const scenario = getMockTaskScenarios()[0];
  const response = getMockTaskEstimates(scenario.tasks);
  response.estimates[0].sessionMinutes[0] = 999;
  response.estimates[0].priorityRank = 999;
  assert.deepEqual(getMockTaskEstimates(scenario.tasks), scenario.response);
  scenario.tasks[0].title = 'Changed fixture';
  scenario.response.estimates.length = 0;
  const fresh = getMockTaskScenarios()[0];
  assert.deepEqual(getMockTaskEstimates(fresh.tasks), fresh.response);
});

test('missing, explicit mock, and empty mode configuration return the existing valid responses', () => {
  for (const scenario of getMockTaskScenarios()) {
    assert.deepEqual(getTaskEstimates(scenario.tasks), scenario.response);
    for (const mode of [undefined, 'mock', '']) {
      const response = getTaskEstimates(scenario.tasks, mode);
      assert.deepEqual(TaskEstimatesResponseSchema.parse(response), scenario.response);
    }
  }
});

test('live mode fails explicitly without falling back to mock', () => {
  const scenario = getMockTaskScenarios()[0];
  assert.throws(() => getTaskEstimates(scenario.tasks, 'live'), /live task-estimate provider has not been implemented/);
  assert.throws(() => getTaskEstimates([], 'live'), /live task-estimate provider has not been implemented/);
});

test('unsupported mode values are rejected', () => {
  const scenario = getMockTaskScenarios()[0];
  for (const mode of ['unknown', 'MOCK', ' mock ', ' ', null, 0]) {
    assert.throws(() => getTaskEstimates(scenario.tasks, mode), /Unsupported LLM_MODE/);
  }
});

test('provider selection preserves unsupported-input errors and deterministic results', () => {
  assert.throws(() => getTaskEstimates([], 'mock'), /Unsupported mock task inputs/);
  const scenario = getMockTaskScenarios()[0];
  assert.deepEqual(getTaskEstimates(scenario.tasks), getTaskEstimates(scenario.tasks, 'mock'));
  assert.deepEqual(getTaskEstimates([...scenario.tasks].reverse(), ''), scenario.response);
});

test('the server-side interface works in a process with no environment variables or API key', () => {
  const output = execFileSync(process.execPath, [
    '--experimental-strip-types', '--input-type=module', '-e',
    `import { getTaskEstimates } from './supabase/functions/_shared/llm/task-estimates.ts';
     import { getMockTaskScenarios } from './supabase/functions/_shared/llm/mock-task-scenarios.ts';
     console.log(JSON.stringify(getTaskEstimates(getMockTaskScenarios()[0].tasks)));`,
  ], { cwd: new URL('../', import.meta.url), env: {}, encoding: 'utf8' });
  assert.deepEqual(JSON.parse(output), getMockTaskScenarios()[0].response);
});
