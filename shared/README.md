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
