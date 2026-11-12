import { z } from 'zod';

import { IdSchema, IsoDateTimeSchema } from './common.ts';

export const CommitmentKindSchema = z.enum(['extracurricular', 'personal', 'meal', 'break', 'other']);

/** A one-off fixed event (club meeting, shift, dinner) that tasks must not overlap. */
export const CommitmentSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  title: z.string().trim().min(1).max(200),
  kind: CommitmentKindSchema,
  startAt: IsoDateTimeSchema,
  endAt: IsoDateTimeSchema,
});

export const CommitmentInputSchema = CommitmentSchema.omit({ id: true, userId: true });

export type CommitmentKind = z.infer<typeof CommitmentKindSchema>;
export type Commitment = z.infer<typeof CommitmentSchema>;
export type CommitmentInput = z.infer<typeof CommitmentInputSchema>;
