import { z } from 'zod';

/** Row id. Supabase rows use UUIDs; synthetic fixtures may use readable ids like "s1-task-3". */
export const IdSchema = z.string().min(1).max(64);

/** ISO 8601 date-time with offset, e.g. "2026-11-16T14:30:00-07:00" or "...Z". */
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });

/** ISO 8601 calendar date, e.g. "2026-11-16". */
export const IsoDateSchema = z.iso.date();

/** Local wall-clock time, 24-hour "HH:MM". */
export const TimeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM (24-hour)');

export const WeekdaySchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

/** A positive whole number of minutes. */
export const MinutesSchema = z.number().int().positive();

export type Id = z.infer<typeof IdSchema>;
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;
export type IsoDate = z.infer<typeof IsoDateSchema>;
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;
export type Weekday = z.infer<typeof WeekdaySchema>;
