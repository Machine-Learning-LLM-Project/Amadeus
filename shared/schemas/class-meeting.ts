import { z } from 'zod';

import { IdSchema, IsoDateSchema, TimeOfDaySchema, WeekdaySchema } from './common.ts';

/**
 * A class that repeats weekly between termStart and termEnd.
 * Cross-field rules (endTime > startTime, termEnd >= termStart) are checked in code,
 * not with .refine(), so that .omit()/.extend() keep working on this schema.
 */
export const ClassMeetingSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  name: z.string().trim().min(1).max(100),
  location: z.string().max(100).nullable(),
  days: z.array(WeekdaySchema).min(1),
  startTime: TimeOfDaySchema,
  endTime: TimeOfDaySchema,
  termStart: IsoDateSchema,
  termEnd: IsoDateSchema,
});

export const ClassMeetingInputSchema = ClassMeetingSchema.omit({ id: true, userId: true });

export type ClassMeeting = z.infer<typeof ClassMeetingSchema>;
export type ClassMeetingInput = z.infer<typeof ClassMeetingInputSchema>;
