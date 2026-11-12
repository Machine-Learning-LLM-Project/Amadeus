// DRAFT. TODO(Bayasaa): brief prompt + content. TODO(Gilberto): schema review.
// OpenAI strict structured outputs need every field present: use .nullable(), never .optional().
import { z } from 'zod';

export const MorningBriefSchema = z.object({
  greeting: z.string().max(200),
  /** Most important tasks for today, highest priority first. */
  topTaskIds: z.array(z.string()).max(5),
  /** Scheduling notes or warnings, e.g. "Two deadlines tomorrow". */
  notes: z.array(z.string().max(200)),
  /** Short text suitable for a notification. */
  notificationText: z.string().max(140),
});

export type MorningBrief = z.infer<typeof MorningBriefSchema>;
