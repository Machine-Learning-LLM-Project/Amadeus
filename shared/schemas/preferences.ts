import { z } from 'zod';

import { IdSchema, TimeOfDaySchema } from './common.ts';

/** Per-user scheduling settings the scheduler and checker rely on. */
export const UserPreferencesSchema = z.object({
  userId: IdSchema,
  /** IANA time zone, e.g. "America/Denver". */
  timezone: z.string().min(1),
  /** Earliest time a work session may start. */
  dayStart: TimeOfDaySchema.default('08:00'),
  /** Latest time a work session may end. */
  dayEnd: TimeOfDaySchema.default('22:00'),
  /** Free time kept before and after classes and commitments. */
  bufferMinutes: z.number().int().min(0).max(120).default(10),
  /** Longest single work session before a split is required. */
  maxSessionMinutes: z.number().int().min(15).max(480).default(90),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
