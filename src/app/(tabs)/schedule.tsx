import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { clockLabel, entriesForDay, moveDay } from '@/components/day-agenda';
import { sampleAgenda, sampleDay } from '@/components/sample-agenda';

const dateHeading = new Intl.DateTimeFormat('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
});
const weekdayName = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' });
const palette = {
  Class: { ink: '#245B55', paper: '#E9F2EF' },
  'Work session': { ink: '#354F83', paper: '#EDF1FA' },
  Commitment: { ink: '#7D532E', paper: '#F7EFE5' },
};

export default function ScheduleScreen() {
  const [day, setDay] = useState(sampleDay);
  const selected = new Date(day + 'T12:00:00Z');
  const monday = moveDay(day, -((selected.getUTCDay() + 6) % 7));
  const entries = entriesForDay(day, sampleAgenda);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.caption}>Sample schedule · Denver time</Text>
      <Text accessibilityRole="header" style={styles.heading}>{dateHeading.format(selected)}</Text>
      <View style={styles.navigation}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous week"
          onPress={() => setDay(d => moveDay(d, -7))} style={styles.navButton}>
          <Text style={styles.navText}>‹ Week</Text>
        </Pressable>
        <Text style={styles.year}>{selected.getUTCFullYear()}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next week"
          onPress={() => setDay(d => moveDay(d, 7))} style={styles.navButton}>
          <Text style={styles.navText}>Week ›</Text>
        </Pressable>
      </View>
      <View style={styles.week}>
        {Array.from({ length: 7 }, (_, index) => {
          const value = moveDay(monday, index);
          const date = new Date(value + 'T12:00:00Z');
          const active = value === day;
          return (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: active }}
              accessibilityLabel={dateHeading.format(date)} onPress={() => setDay(value)}
              style={[styles.day, active && styles.selected]}>
              <Text style={[styles.weekday, active && styles.white]}>{weekdayName.format(date)}</Text>
              <Text style={[styles.number, active && styles.white]}>{date.getUTCDate()}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.agenda}>
        {entries.map(entry => {
          const color = palette[entry.kind];
          return (
            <View key={entry.key} style={styles.row}>
              <View style={styles.hours}>
                <Text style={styles.start}>{clockLabel(entry.start)}</Text>
                <Text style={styles.end}>{clockLabel(entry.end)}</Text>
              </View>
              <View style={[styles.event, { backgroundColor: color.paper, borderLeftColor: color.ink }]}>
                <Text style={[styles.kind, { color: color.ink }]}>{entry.kind}</Text>
                <Text style={styles.title}>{entry.title}</Text>
                {entry.detail && <Text style={styles.detail}>{entry.detail}</Text>}
              </View>
            </View>
          );
        })}
        {entries.length === 0 && <Text style={styles.empty}>Nothing scheduled for this day.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFBF8' },
  content: { width: '100%', maxWidth: 740, alignSelf: 'center', paddingHorizontal: 16,
    paddingTop: 28, paddingBottom: 36 },
  caption: { color: '#52665D', fontSize: 14, fontWeight: '600' },
  heading: { color: '#19392F', fontSize: 32, fontWeight: '700', marginTop: 5 },
  navigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  navButton: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
  navText: { color: '#255B48', fontSize: 15, fontWeight: '600' },
  year: { color: '#58655F', fontSize: 14 },
  week: { flexDirection: 'row', backgroundColor: '#EDF1EC', borderRadius: 14, padding: 3 },
  day: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 60, borderRadius: 11 },
  selected: { backgroundColor: '#245441' },
  weekday: { color: '#52605A', fontSize: 12 },
  number: { color: '#243D31', fontWeight: '700', fontSize: 18, marginTop: 3 },
  white: { color: '#FFFFFF' },
  agenda: { marginTop: 24, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  hours: { minWidth: 72, paddingTop: 12, gap: 4 },
  start: { color: '#21372D', fontSize: 14, fontWeight: '700' },
  end: { color: '#57655F', fontSize: 13 },
  event: { flex: 1, borderRadius: 10, borderLeftWidth: 3, padding: 14, gap: 4 },
  kind: { fontSize: 12, fontWeight: '700' },
  title: { color: '#162D26', fontSize: 18, fontWeight: '600' },
  detail: { color: '#47564D', fontSize: 14, lineHeight: 20 },
  empty: { color: '#52605A', paddingVertical: 24, textAlign: 'center' },
});
