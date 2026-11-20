import type { ClassMeeting, Commitment, ScheduleBlock, Task, Weekday } from '@shared';

export type AgendaData = {
  timezone: string;
  classes: ClassMeeting[];
  commitments: Commitment[];
  tasks: Pick<Task, 'id' | 'title'>[];
  blocks: ScheduleBlock[];
};

type Entry = {
  key: string;
  kind: 'Class' | 'Work session' | 'Commitment';
  title: string;
  start: string;
  end: string;
  detail: string | null;
};

const weekdays: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Use UTC for calendar arithmetic so advancing a day also works across DST changes.
export function moveDay(day: string, distance: number) {
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + distance);
  return date.toISOString().slice(0, 10);
}

export function clockLabel(time: string) {
  const [hour, minute] = time.split(':');
  return (Number(hour) % 12 || 12) + ':' + minute + (Number(hour) % 24 < 12 ? ' AM' : ' PM');
}

export function entriesForDay(day: string, data: AgendaData): Entry[] {
  const weekday = weekdays[new Date(day + 'T12:00:00Z').getUTCDay()];
  const entries: Entry[] = data.classes
    .filter(c => c.termStart <= day && day <= c.termEnd && c.days.includes(weekday))
    .map(c => ({
      key: 'class-' + c.id, kind: 'Class', title: c.name,
      start: c.startTime, end: c.endTime, detail: c.location,
    }));

  const dateFormat = new Intl.DateTimeFormat('sv-SE', {
    timeZone: data.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const timeFormat = new Intl.DateTimeFormat('en-GB', {
    timeZone: data.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });

  // Clip overnight sessions to the visible day. An end at midnight belongs to the previous day.
  function addTimedEntry(start: string, end: string, entry: Omit<Entry, 'start' | 'end'>) {
    const from = new Date(start);
    const until = new Date(end);
    const firstDay = dateFormat.format(from);
    const lastDay = dateFormat.format(new Date(until.getTime() - 1));
    if (until <= from || day < firstDay || day > lastDay) return;
    entries.push({
      ...entry,
      start: firstDay < day ? '00:00' : timeFormat.format(from),
      end: dateFormat.format(until) > day ? '24:00' : timeFormat.format(until),
    });
  }

  for (const item of data.commitments) {
    addTimedEntry(item.startAt, item.endAt, {
      key: 'commitment-' + item.id, kind: 'Commitment', title: item.title, detail: null,
    });
  }
  for (const block of data.blocks) {
    if (block.status === 'rejected') continue;
    const task = data.tasks.find(t => t.id === block.taskId);
    const details = [block.status === 'accepted' ? 'Accepted' : 'Proposed'];
    if (block.aiGenerated) details.push('AI suggestion');
    if (block.sessionCount > 1) details.push(`Session ${block.sessionIndex} of ${block.sessionCount}`);
    addTimedEntry(block.start, block.end, {
      key: 'work-' + block.id, kind: 'Work session', title: task?.title ?? 'Study session',
      detail: details.join(' · '),
    });
  }
  return entries.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}
