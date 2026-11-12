import { TaskStatusSchema } from '@shared';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function TasksScreen() {
  return (
    <PlaceholderScreen
      title="Tasks"
      owner="Matthew"
      notes={`Add and list tasks, saved to Supabase. Statuses: ${TaskStatusSchema.options.join(', ')}`}
    />
  );
}
