# shared/

Zod schemas and TypeScript types shared by everything in the repo:

| Consumer | How it imports |
| --- | --- |
| Expo app (`src/`) | `import { TaskSchema, type Task } from '@shared'` |
| Eval runner (`eval/`, run with `tsx`) | same `@shared` alias via `tsconfig.json` |
| Supabase edge functions (Deno) | via an import map in `supabase/functions/deno.json` (set up with Supabase) |

## Rules

- **Schemas are the source of truth.** Write the Zod schema, then `export type X = z.infer<typeof XSchema>`. Never hand-write a duplicate interface.
- **Keep it pure.** Only `zod` and other files in `shared/`. No `react-native`, `expo`, Node, or Deno APIs.
- **Keep `.ts` extensions** on relative imports (`'./common.ts'`). Deno requires them.
- **No `.refine()` on base object schemas.** It breaks `.omit()`/`.extend()`. Do cross-field checks in code.
- **LLM output schemas (`llm/`) use `.nullable()`, never `.optional()`.** OpenAI strict structured output needs every field present.

## Layout

- `constants.ts`: model name, budget limit, loop attempts, token cap, prices.
- `schemas/`: domain data (tasks, classes, commitments, preferences, schedules, usage log).
- `llm/`: structured outputs the model returns. These are drafts owned by Gilberto (brief: Bayasaa).

For task estimates, use `TaskEstimatesResponseSchema` for structured output and
`validateTaskEstimatesResponse(output, tasks, limits)` before consuming a response.
The validator expects already-validated tasks and returns parsed estimates or throws
a `ZodError` with field paths. `priorityRank` is a complete ordering from 1 to the
task count; it does not assign or map to `Task.priority`.

Pass `maxSessionMinutes` from user preferences and an explicit
`defaultMinSessionMinutes` (positive whole minutes or `null`). Preferences do not yet
define a default minimum. A split task with no task minimum and no caller default
is rejected until that decision is resolved. Minimums apply to every session of
a split task, including the remainder; unsplit tasks may be shorter. The maximum
applies to every session, so an unsplittable task exceeding it is rejected rather
than silently split. These checks do not determine whether a schedule is feasible.

Run the focused offline tests with `npm run test:task-estimates` (Node's built-in
test runner and TypeScript stripping; no additional dependencies).
