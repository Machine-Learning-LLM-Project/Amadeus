import { useState } from 'react';
import { Text } from 'react-native';
import { IsoDateSchema, TaskInputSchema, TimeOfDaySchema, type TaskInput } from '@shared';

import { Action, Field, RecordList, s, type EditorProps } from '@/components/record-list';
import { createTask, listTasks } from '@/lib/data';

function TaskForm({ save, busy }: EditorProps<TaskInput>) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  function submit() {
    if (!title.trim()) return setError('Enter a task title.');
    if (!IsoDateSchema.safeParse(date).success) return setError('Enter a valid due date in YYYY-MM-DD format.');
    if (!TimeOfDaySchema.safeParse(time).success) return setError('Enter the due time in 24-hour HH:MM format.');
    const due = new Date(date + 'T' + time + ':00');
    if (due.getHours() !== Number(time.slice(0, 2)) || due.getMinutes() !== Number(time.slice(3))) {
      return setError('That local time skips ahead for daylight saving. Choose another time.');
    }
    const input = TaskInputSchema.safeParse({
      title, dueAt: due.toISOString(), course: null, description: null, estimatedMinutes: null,
      splittable: true, minSessionMinutes: null, priority: null, status: 'todo', source: 'manual',
    });
    if (!input.success) return setError('Check the task title and deadline.');
    setError('');
    save(input.data);
  }

  return <>
    <Field label="Task title" placeholder="Calculus problem set" value={title} onChangeText={setTitle}
      autoCapitalize="sentences" maxLength={200} editable={!busy} />
    <Field label="Due date" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate}
      maxLength={10} editable={!busy} />
    <Field label="Due time (local, 24-hour)" placeholder="17:00" value={time} onChangeText={setTime}
      maxLength={5} editable={!busy} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Action title={busy ? 'Saving…' : 'Save task'} onPress={submit} disabled={busy} />
  </>;
}

const deadline = new Intl.DateTimeFormat(undefined, {
  year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

export default function TasksScreen() {
  return <RecordList heading="My tasks" addLabel="Add task" empty="No tasks yet."
    list={listTasks} create={createTask} compare={(a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt)}
    editor={TaskForm}
    row={task => <>
      <Text style={s.title}>{task.title}</Text>
      <Text style={s.meta}>Due {deadline.format(new Date(task.dueAt))}</Text>
    </>} />;
}
