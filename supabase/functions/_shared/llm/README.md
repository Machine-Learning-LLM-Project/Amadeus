# Mock task estimates

This server-side module returns predefined task estimates without a model, API key,
network access, or Supabase setup. It is not exported through `@shared` or used by
the app. The small provider fixtures are separate from the evaluation student data.

`getMockTaskScenarios()` returns fresh synthetic tasks and expected responses for
`two-deadlines` (reading plus a split lab) and `short-review` (one unsplit task).
Both tasks and responses are parsed with the existing shared schemas.

`getMockTaskEstimates(tasks)` selects a scenario by matching all schema-defined task
fields and the full task count. Input order does not matter. Changed, partial,
duplicate, combined, empty, or unknown task sets throw an unsupported-input error;
malformed tasks throw a Zod error. No task is updated, and `priorityRank` remains
separate from `Task.priority`.

Use `getTaskEstimates(tasks, mode)` as the server-side entry point. It delegates to
the existing mock provider and preserves its schema validation and input errors.
Pass the server's `LLM_MODE` value explicitly: `undefined`, an omitted argument,
or `''` defaults to mock; `'mock'` selects mock; `'live'` throws because the live
provider is not implemented. Other values, including whitespace or different
capitalization, throw an unsupported-mode error. Live never falls back to mock.

The module does not read environment variables itself. A future Supabase Edge
Function can call `getTaskEstimates(tasks, Deno.env.get('LLM_MODE'))`; a Node server
can call `getTaskEstimates(tasks, process.env.LLM_MODE)`. This keeps runtime-specific
environment access at the caller and requires no API key or new dependencies.
Omitting the argument always uses mock, regardless of the ambient environment.

From the repository root, run this offline example with an explicit mode:

```bash
node --experimental-strip-types --input-type=module -e "import { getMockTaskScenarios } from './supabase/functions/_shared/llm/mock-task-scenarios.ts'; import { getTaskEstimates } from './supabase/functions/_shared/llm/task-estimates.ts'; console.log(getTaskEstimates(getMockTaskScenarios()[0].tasks, 'mock'));"
```

Run `npm run test:llm-mock` for focused tests and `npm run check` for the repository
checks. The tests use Node's built-in runner with no additional dependencies.

The provider uses only the existing response schema, so it does not depend on or
duplicate the semantic validator awaiting merge in PR #3. Wiring that validator,
mock usage logging, and backend invocation remain separate
integration work. No edge function, deployment configuration, or live provider is
created here.
