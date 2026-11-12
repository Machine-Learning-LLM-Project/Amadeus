import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  owner: string;
  notes?: string;
};

/** Temporary screen body used until the real screen is built. Delete when no longer used. */
export function PlaceholderScreen({ title, owner, notes }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text>TODO ({owner})</Text>
      {notes ? <Text style={styles.notes}>{notes}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '600' },
  notes: { opacity: 0.6, textAlign: 'center' },
});
