import { TaskEstimatesResponseSchema } from '../../../../shared/llm/task-estimate.ts';
import { TaskSchema } from '../../../../shared/schemas/task.ts';

/** Small provider fixtures, independent of the evaluation student dataset. */
export function getMockTaskScenarios() {
  const taskDefaults = {
    userId: 'mock-student-1',
    description: null,
    course: 'Fictional course',
    estimatedMinutes: null,
    priority: null,
    status: 'todo',
    source: 'synthetic',
    createdAt: '2026-11-20T08:00:00-07:00',
  };
  const scenarios = [
    {
      name: 'two-deadlines',
      tasks: [
        {
          ...taskDefaults,
          id: 'mock-reading',
          title: 'Read a fictional chapter',
          dueAt: '2026-11-22T18:00:00-07:00',
          splittable: false,
          minSessionMinutes: null,
        },
        {
          ...taskDefaults,
          id: 'mock-lab',
          title: 'Complete a fictional lab',
          dueAt: '2026-11-21T18:00:00-07:00',
          splittable: true,
          minSessionMinutes: 30,
        },
      ],
      response: {
        estimates: [
          {
            taskId: 'mock-reading',
            estimatedMinutes: 45,
            sessionMinutes: [45],
            priorityRank: 2,
            rationale: 'The reading fits in one session and has the later deadline.',
          },
          {
            taskId: 'mock-lab',
            estimatedMinutes: 120,
            sessionMinutes: [60, 60],
            priorityRank: 1,
            rationale: 'The lab is due sooner and can be divided into two work sessions.',
          },
        ],
      },
    },
    {
      name: 'short-review',
      tasks: [
        {
          ...taskDefaults,
          id: 'mock-review',
          title: 'Review fictional practice notes',
          dueAt: '2026-11-21T12:00:00-07:00',
          splittable: false,
          minSessionMinutes: null,
        },
      ],
      response: {
        estimates: [
          {
            taskId: 'mock-review',
            estimatedMinutes: 20,
            sessionMinutes: [20],
            priorityRank: 1,
            rationale: 'A short review fits in one session and is the only task.',
          },
        ],
      },
    },
  ];

  // Parsing also gives each caller fresh fixture objects.
  return scenarios.map((scenario) => ({
    name: scenario.name,
    tasks: TaskSchema.array().parse(scenario.tasks),
    response: TaskEstimatesResponseSchema.parse(scenario.response),
  }));
}
