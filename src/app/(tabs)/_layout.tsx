import { Pressable, Text } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';

import { supabase } from '@/lib/supabase';

// TODO(Matthew): tab icons, styling, and any extra screens (accept/reject flow, settings).
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarIcon: () => null,
        headerRight: () => (
          <Pressable onPress={() => supabase.auth.signOut()} style={{ paddingHorizontal: 16 }}>
            <Text>Sign out</Text>
          </Pressable>
        ),
      }}>
      <Tabs.Screen name="index" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="classes" options={{ title: 'Classes' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="brief" options={{ title: 'Brief' }} />
    </Tabs>
  );
}
