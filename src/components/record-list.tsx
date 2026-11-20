import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor="#66756C"
      style={s.input} autoCapitalize="none" {...props} />
  </View>;
}

export function Action({ title, onPress, disabled = false, secondary = false }: {
  title: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={[s.button, secondary && s.secondary, disabled && s.disabled]}>
    <Text style={[s.buttonText, secondary && s.secondaryText]}>{title}</Text>
  </Pressable>;
}

export type EditorProps<I> = { save: (input: I) => void; busy: boolean };

type ListProps<T, I> = {
  heading: string; addLabel: string; empty: string;
  list: () => Promise<T[]>; create: (input: I) => Promise<T>;
  compare: (a: T, b: T) => number;
  editor: ComponentType<EditorProps<I>>; row: (item: T) => ReactNode;
};

export function RecordList<T extends { id: string }, I>(props: ListProps<T, I>) {
  const { list, editor: Editor } = props;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const submitting = useRef(false);
  const request = useRef(0);

  const reload = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setLoadError(false);
    try {
      const result = await list();
      if (id === request.current) setItems(result);
    } catch {
      if (id === request.current) setLoadError(true);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [list]);

  useFocusEffect(useCallback(() => {
    void reload();
    return () => { request.current++; };
  }, [reload]));

  async function save(input: I) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setSaveError(false);
    try {
      const item = await props.create(input);
      setItems(previous => [...previous.filter(value => value.id !== item.id), item]);
      Keyboard.dismiss();
      setEditing(false);
      // Refresh after writing so a slower, earlier list request cannot hide the new record.
      void reload();
    } catch {
      setSaveError(true);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"
    automaticallyAdjustKeyboardInsets>
    <View style={s.header}>
      <Text accessibilityRole="header" style={s.heading}>{props.heading}</Text>
      <Action title={editing ? 'Cancel' : props.addLabel} secondary={editing} disabled={busy}
        onPress={() => { setSaveError(false); setEditing(!editing); }} />
    </View>
    {editing && <View style={s.form}>
      <Editor save={save} busy={busy} />
      {saveError && <Text accessibilityRole="alert" style={s.error}>Couldn’t confirm the save. Check your connection and the list before retrying.</Text>}
    </View>}
    {loadError ? <View style={s.card}>
      <Text accessibilityRole="alert" style={s.error}>Couldn’t load the latest list.</Text>
      <Action title="Retry loading" secondary onPress={reload} />
    </View> : loading ? <Text style={s.meta}>Loading…</Text> :
      items.length === 0 && <Text style={s.meta}>{props.empty}</Text>}
    {[...items].sort(props.compare).map(item => <View key={item.id} style={s.card}>{props.row(item)}</View>)}
  </ScrollView>;
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFBF8' },
  content: { width: '100%', maxWidth: 740, alignSelf: 'center', padding: 18, paddingBottom: 44, gap: 12 },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginVertical: 8 },
  heading: { fontSize: 30, color: '#19392F', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '600', color: '#19392F' },
  meta: { fontSize: 15, color: '#485E53', lineHeight: 22 },
  form: { padding: 16, gap: 14, backgroundColor: '#EFF4EF', borderRadius: 12 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#D4DFD7', borderWidth: 1, borderRadius: 10, padding: 15, gap: 5 },
  field: { gap: 5 },
  label: { fontWeight: '600', fontSize: 15, color: '#233D31' },
  input: { minHeight: 44, borderWidth: 1, borderColor: '#85988A', borderRadius: 7, paddingHorizontal: 11,
    paddingVertical: 8, fontSize: 16, backgroundColor: '#FFFFFF', color: '#192F25' },
  button: { minHeight: 44, borderRadius: 8, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: '#245441' },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  secondary: { backgroundColor: '#E3EBE4' },
  secondaryText: { color: '#254B39' },
  disabled: { opacity: 0.55 },
  error: { fontSize: 14, color: '#942F2F' },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  day: { minWidth: 45, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#FFFFFF' },
  selected: { backgroundColor: '#245441' },
});
