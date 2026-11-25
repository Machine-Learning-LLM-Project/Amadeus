import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { z } from 'zod';
import { MorningBriefSchema } from '@shared';

import { clockLabel, entriesForDay } from '@/components/day-agenda';
import { Action, s } from '@/components/record-list';
import { usePlanner } from '@/components/use-planner';
import type { Planner } from '@/lib/planner';
import { supabase } from '@/lib/supabase';

const replySchema = z.object({
  aiGenerated: z.literal(true), mode: z.enum(['mock', 'live']), brief: MorningBriefSchema,
});

function DailyBrief({ planner }: { planner: Planner }) {
  const [notes, setNotes] = useState<z.infer<typeof replySchema> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { tasks, timezone, today, now } = planner;
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: timezone });
  const deadline = new Intl.DateTimeFormat(undefined, {
    timeZone: timezone, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  const active = tasks.filter(t => t.status !== 'done' && t.status !== 'dropped');
  const priorities = [...active].sort((a, b) =>
    (a.priority ?? 6) - (b.priority ?? 6) || Date.parse(a.dueAt) - Date.parse(b.dueAt)).slice(0, 5);
  const urgent = active.filter(t => date.format(new Date(t.dueAt)) <= today);
  const agenda = entriesForDay(today, planner).filter(e => e.kind !== 'Work session' || e.acceptedWork);

  async function requestNotes() {
    setBusy(true);
    setError('');
    try {
      const response = await supabase.functions.invoke('morning-brief', { headers: { 'x-planner-timezone': timezone } });
      if (response.error) throw response.error;
      const parsed = replySchema.parse(response.data);
      if (parsed.brief.topTaskIds.some(id => !active.some(t => t.id === id))) {
        throw new Error('Stale brief');
      }
      setNotes(parsed);
    } catch {
      setError('Brief notes are unavailable. Your saved priorities and schedule are shown below.');
    } finally {
      setBusy(false);
    }
  }

  return <ScrollView style={s.screen} contentContainerStyle={s.content}>
    <Text style={s.meta}>{new Intl.DateTimeFormat(undefined, {
      timeZone: timezone, weekday: 'long', month: 'long', day: 'numeric',
    }).format(now)} · {timezone}</Text>
    <Text accessibilityRole="header" style={s.heading}>Morning brief</Text>
    {notes ? <View style={s.card}>
      <Text style={s.label}>{notes.mode === 'mock' ? 'AI brief · mock preview' : 'AI-generated brief'}</Text>
      <Text style={s.title}>{notes.brief.greeting}</Text>
      {notes.brief.topTaskIds.map(id => <Text key={id} style={s.meta}>{active.find(t => t.id === id)?.title}</Text>)}
      {notes.brief.notes.map((line, index) => <Text key={index} style={s.meta}>{line}</Text>)}
    </View> : <Action secondary title={busy ? 'Loading brief notes…' : 'Get brief notes'} disabled={busy} onPress={requestNotes} />}
    {!!error && <Text accessibilityRole="alert" style={s.meta}>{error}</Text>}
    {urgent.length > 0 && <View style={s.card}>
      <Text accessibilityRole="header" style={s.title}>Deadlines to watch</Text>
      {urgent.map(t => <Text key={t.id} style={s.meta}>
        {Date.parse(t.dueAt) < now ? 'Overdue' : 'Due today'} · {t.title} · {deadline.format(new Date(t.dueAt))}
      </Text>)}
    </View>}
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.title}>Top priorities</Text>
      {priorities.map(t => <View key={t.id} style={s.field}>
        <Text style={s.label}>{t.title}</Text>
        <Text style={s.meta}>Due {deadline.format(new Date(t.dueAt))}</Text>
      </View>)}
      {!priorities.length && <Text style={s.meta}>No open tasks.</Text>}
    </View>
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.title}>Today’s schedule</Text>
      {agenda.map(e => <Text key={e.key} style={s.meta}>
        {clockLabel(e.start)} – {clockLabel(e.end)} · {e.title}
      </Text>)}
      {!agenda.length && <Text style={s.meta}>No classes, commitments, or accepted work sessions today.</Text>}
    </View>
  </ScrollView>;
}

export default function BriefScreen() {
  const { data, error, refresh } = usePlanner();
  if (data) return <DailyBrief planner={data} />;
  return <View style={s.content}>
    <Text style={s.meta}>{error ? 'Couldn’t load your morning brief.' : 'Loading your morning brief…'}</Text>
    {error && <Action title="Retry" onPress={refresh} />}
  </View>;
}
