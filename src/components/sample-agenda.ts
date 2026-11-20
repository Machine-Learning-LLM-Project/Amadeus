import type { AgendaData } from './day-agenda';

// A preview based on eval's synthetic student-01. Work blocks illustrate scheduler output.
export const sampleDay = '2026-11-20';
const userId = 'student-01';
const term = { userId, termStart: '2026-08-24', termEnd: '2026-12-11' };

export const sampleAgenda: AgendaData = {
  timezone: 'America/Denver',
  classes: [
    { ...term, id: 'algebra', name: 'Algebra 101', location: 'North Hall 101',
      days: ['mon', 'wed', 'fri'], startTime: '09:00', endTime: '09:50' },
    { ...term, id: 'history', name: 'History 201', location: 'West Hall 204',
      days: ['tue', 'thu'], startTime: '11:00', endTime: '12:15' },
    { ...term, id: 'biology', name: 'Biology 110', location: 'Science Hall 300',
      days: ['mon', 'wed'], startTime: '14:00', endTime: '15:15' },
  ],
  tasks: [
    { id: 'practice', title: 'Complete algebra practice set' },
    { id: 'reflection', title: 'Draft history reflection' },
  ],
  blocks: [
    { id: 'practice-1', taskId: 'practice', start: '2026-11-20T10:15:00-07:00',
      end: '2026-11-20T11:45:00-07:00', sessionIndex: 1, sessionCount: 1,
      status: 'accepted', aiGenerated: true },
    { id: 'reflection-1', taskId: 'reflection', start: '2026-11-20T13:00:00-07:00',
      end: '2026-11-20T14:00:00-07:00', sessionIndex: 1, sessionCount: 2,
      status: 'proposed', aiGenerated: true },
    { id: 'reflection-2', taskId: 'reflection', start: '2026-11-21T11:00:00-07:00',
      end: '2026-11-21T12:00:00-07:00', sessionIndex: 2, sessionCount: 2,
      status: 'proposed', aiGenerated: true },
  ],
  commitments: [
    { userId, id: 'shift', title: 'Dinner shift', kind: 'personal',
      startAt: '2026-11-20T18:00:00-07:00', endAt: '2026-11-20T20:00:00-07:00' },
  ],
};
