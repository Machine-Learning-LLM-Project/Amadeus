import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '@/lib/supabase';

// Functional sign-in / sign-up. TODO(Matthew): styling, keyboard handling, password reset.
// Email confirmation is turned off in the Supabase dashboard, so sign-up signs you in right away.
export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(mode: 'sign-in' | 'sign-up') {
    setBusy(true);
    setError(null);
    const credentials = { email: email.trim(), password };
    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);
    // On success the auth listener updates the session and the router switches to the tabs.
    if (error) setError(error.message);
    setBusy(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Amadeus</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (6+ characters)"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {busy ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.buttons}>
          <Pressable style={styles.button} onPress={() => submit('sign-in')}>
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.secondary]} onPress={() => submit('sign-up')}>
            <Text>Create account</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, maxWidth: 420, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  error: { color: '#c00' },
  buttons: { gap: 8 },
  button: { backgroundColor: '#208AEF', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '600' },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ccc' },
});
