import type { Task } from '../../shared/schemas/task.ts';
import type { Schedule } from '../../shared/schemas/schedule.ts';

export const SYNTHETIC_USER = '00000000-0000-4000-8000-000000000001';
export const OTHER_SYNTHETIC_USER = '00000000-0000-4000-8000-000000000002';
export const task: Task = {
  id: 'synthetic-task-1', userId: SYNTHETIC_USER, title: 'Practice algebra',
  description: null, course: 'Synthetic Math', dueAt: '2026-11-24T17:00:00-07:00',
  estimatedMinutes: 30, splittable: false, minSessionMinutes: null,
  priority: 1, status: 'scheduled', source: 'synthetic', createdAt: '2026-11-23T08:00:00-07:00',
};
export const schedule: Schedule = {
  userId: SYNTHETIC_USER, generatedAt: task.createdAt, warnings: [],
  blocks: [{
    id: 'synthetic-block-1', taskId: task.id, start: '2026-11-23T10:00:00-07:00',
    end: '2026-11-23T10:30:00-07:00', sessionIndex: 1, sessionCount: 1,
    status: 'accepted', aiGenerated: true,
  }],
};
export const briefContext = {
  date: '2026-11-23', timezone: 'America/Denver', tasks: [task], schedule,
};
