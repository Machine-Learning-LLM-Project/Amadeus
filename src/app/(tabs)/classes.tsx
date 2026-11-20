import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  ClassMeetingInputSchema, IsoDateSchema, TimeOfDaySchema, WeekdaySchema,
  type ClassMeetingInput, type Weekday,
} from '@shared';

import { clockLabel } from '@/components/day-agenda';
import { Action, Field, RecordList, s, type EditorProps } from '@/components/record-list';
import { createClassMeeting, listClassMeetings } from '@/lib/data';

const dayNames: Record<Weekday, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

function ClassForm({ save, busy }: EditorProps<ClassMeetingInput>) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [days, setDays] = useState<Weekday[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [error, setError] = useState('');

  function submit() {
    if (!name.trim()) return setError('Enter a class name.');
    if (!days.length) return setError('Select at least one meeting day.');
    if (![start, end].every(t => TimeOfDaySchema.safeParse(t).success)) {
      return setError('Enter both meeting times in 24-hour HH:MM format.');
    }
    if (end <= start) return setError('The class must end after it starts.');
    if (![first, last].every(d => IsoDateSchema.safeParse(d).success)) {
      return setError('Enter both term dates in YYYY-MM-DD format.');
    }
    if (last < first) return setError('The term must end on or after its first day.');
    const input = ClassMeetingInputSchema.safeParse({
      name, location: location.trim() || null, days: WeekdaySchema.options.filter(d => days.includes(d)),
      startTime: start, endTime: end, termStart: first, termEnd: last,
    });
    if (!input.success) return setError('Check the class details and try again.');
    setError('');
    save(input.data);
  }

  return <>
    <Field label="Class name" placeholder="Calculus I" value={name} onChangeText={setName}
      autoCapitalize="words" maxLength={100} editable={!busy} />
    <View style={s.field}>
      <Text style={s.label}>Meeting days</Text>
      <View style={s.days}>
        {WeekdaySchema.options.map(day => {
          const selected = days.includes(day);
          return <Pressable key={day} accessibilityRole="checkbox" accessibilityLabel={dayNames[day]}
            accessibilityState={{ checked: selected, disabled: busy }} disabled={busy}
            style={[s.day, selected && s.selected]}
            onPress={() => setDays(previous => previous.includes(day)
              ? previous.filter(d => d !== day) : [...previous, day])}>
            <Text style={selected ? s.buttonText : s.label}>{dayNames[day]}</Text>
          </Pressable>;
        })}
      </View>
    </View>
    <Field label="Start time (24-hour)" placeholder="09:00" value={start} onChangeText={setStart} maxLength={5} editable={!busy} />
    <Field label="End time (24-hour)" placeholder="09:50" value={end} onChangeText={setEnd} maxLength={5} editable={!busy} />
    <Field label="First day of term" placeholder="YYYY-MM-DD" value={first} onChangeText={setFirst} maxLength={10} editable={!busy} />
    <Field label="Last day of term" placeholder="YYYY-MM-DD" value={last} onChangeText={setLast} maxLength={10} editable={!busy} />
    <Field label="Location (optional)" placeholder="North Hall 101" value={location} onChangeText={setLocation}
      autoCapitalize="words" maxLength={100} editable={!busy} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Action title={busy ? 'Saving…' : 'Save class'} onPress={submit} disabled={busy} />
  </>;
}

export default function ClassesScreen() {
  return <RecordList heading="My classes" addLabel="Add class" empty="No classes yet."
    list={listClassMeetings} create={createClassMeeting} compare={(a, b) => a.startTime.localeCompare(b.startTime) || a.name.localeCompare(b.name)}
    editor={ClassForm}
    row={item => <>
      <Text style={s.title}>{item.name}</Text>
      <Text style={s.meta}>{item.days.map(d => dayNames[d]).join(' · ')}  {clockLabel(item.startTime)} – {clockLabel(item.endTime)}</Text>
      <Text style={s.meta}>{item.termStart} to {item.termEnd}</Text>
      {item.location && <Text style={s.meta}>{item.location}</Text>}
    </>} />;
}
