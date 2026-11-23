# Bayasaa: guardrails, usage, and morning brief

This contribution implements server-side helpers, the usage migration, four evaluation cases, and focused regression tests. It does not deploy a Supabase project or connect the placeholder app screens. Mock mode is the default and requires no OpenAI key. No paid API calls were used to build or verify this work.

## Run locally

Use the repository's Node version (22.13 or newer) and installed npm dependencies:

```sh
npm run test:bayasaa
npm run check
```

The tests use only synthetic students and fake provider callbacks. They do not read `.env`, access the network, or spend money. `eval/bayasaa/cases.json` contains Bayasaa's four contributions to the team's 20 cases: two injection attempts, the monthly block, and privacy. Additional regression tests do not replace Kadin's full evaluation.

The production SQL tests are `supabase/tests/usage_budget.sql` and `supabase/tests/usage_privacy.sql`. Run them after the migration against a **local synthetic** database, as the database administrator. Both roll back their changes. The budget test temporarily deletes usage rows inside its transaction, so never run it against the team's deployed project. The privacy test checks this contribution's usage table only; Fernando and Kadin must also verify isolation of tasks, classes, and schedules once those tables exist.

For standalone PostgreSQL verification, mount `supabase/migrations` at `/migrations`, `supabase/tests` at `/tests`, and `eval/bayasaa` at `/harness` in a disposable `postgres:17` container, then run `sh /harness/check-database.sh` as the postgres user with a writable `/tmp`. The harness creates minimal Supabase-compatible roles and `auth.uid()` for testing; it is not a replacement for testing deployed Supabase authentication. Do not run `database-bootstrap.sql` on Supabase itself.

## Fernando: usage database

Review and apply `supabase/migrations/20261123000100_usage_guardrails.sql` with your other migrations. This is the only cross-owner database change. It adds:

- A team-wide usage ledger for both signed-in app requests and eval calls (`user_id = null`). No prompts, responses, or raw provider errors are stored.
- RLS allowing signed-in users to read their own usage only. Anonymous access and client writes are denied. Eval usage is visible only to the server/admin.
- Service-role-only `reserve_llm_usage` and `finish_llm_usage` RPCs. The first atomically checks cost plus reservations against $8; the second records actual usage and releases the hold.

Construct `createUsageStore(serviceClient)` from `supabase/functions/_shared/usage-store.ts` using your server-created service-role client. Keep it out of `src/`. There is no new client environment variable or secret in this patch.

Month boundaries use UTC. Completed usage belongs to the month the request started. Unresolved holds from any month still reduce the available balance. Mock requests remain available when the paid budget is exhausted.

If a provider times out or omits token usage, the failed row keeps its reservation. Reconcile that row against provider usage before releasing the hold; do not blindly expire holds or retry the paid call. If persistence fails after a model response, the existing pending reservation remains. Automatic retries are intentionally absent.

## Gilberto: wrap every model call

Use `runGuardedCall` in `supabase/functions/_shared/usage.ts`. Pass the feature, authenticated user ID (or null for evaluation), schema, semantic output checker, saved mock output, messages, and persistent store. The helper supplies `ALLOWED_MODEL`, caps output tokens at `DEFAULT_MAX_OUTPUT_TOKENS`, and rejects attempt numbers outside 1–3. Your workflow still owns when to stop retrying and must pass its actual attempt number.

For live mode implement the `LiveProvider` interface in your connection:

1. Verify real input/output prices using the course/provider source. The existing shared price table is still an unverified proposal estimate. This patch does not present those estimates as confirmed prices. Supply verified prices and explicitly set `pricingVerified` only after checking them.
2. Return a conservative upper bound for **all** billed input tokens, including system text, messages, and structured-output schema overhead. Reserve the resulting worst-case call cost before invoking the model. A bound that is too low invalidates the budget guarantee.
3. Enforce the wrapper's model, output-token cap, and strict response schema in the provider request. Disable SDK retries: each invocation needs its own reservation and log row.
4. Return `{ output, inputTokens, outputTokens }` with actual token counts, even for a billable refusal or unusable answer. Represent unusable output as a value that fails the expected schema. Unknown usage keeps the full hold; known usage is charged even when output validation fails.

Live mode fails closed without this verified provider configuration. A token-bound violation is charged using the actual supplied usage, logged as a failure, and rejected; fix the provider integration before further live evaluation. The database cannot prevent overspending if a provider adapter ignores its token cap or underestimates input.

Use `checkTasks` before constructing task prompts. It enforces the shared schema, user ownership, maximum 100 tasks, total free-text size, duplicate IDs, injection flags, and some sensitive-data patterns. Put task data in a JSON user message; keep system instructions constant. `checkOutput` validates the Zod shape and calls your semantic checker. Use `checkTaskReferences` for returned IDs. Kadin's checker still owns overlaps, deadlines, and class conflicts.

Pattern checks are defense in depth. They cannot prove text is free of personal information or detect every injection. Use synthetic data only, limit provider capabilities, and never give the model task-deletion or schedule-acceptance authority.

## Morning brief integration

`generateMorningBrief` in `supabase/functions/_shared/brief-service.ts` is ready for an authenticated edge-function handler:

```ts
const result = await generateMorningBrief({
  authenticatedUserId: verifiedUser.id,
  context: { date, timezone, tasks, schedule },
  store: createUsageStore(serviceClient),
  // Defaults to mock. Only use the server's explicit LLM_MODE configuration.
});
```

The handler must authenticate the JWT, load that user's records server-side, and derive the local date from trusted current time plus their saved time zone. Do not trust a request-body user ID, mode, provider, or prices. Apply request size/rate limits at that boundary. Keep the shared folder's imports available to Deno through the backend's import map (`zod` is the only package dependency).

The prompt uses active tasks and today's accepted blocks in the supplied IANA time zone. It omits descriptions, user IDs, and schedule warnings, validates returned task IDs, and returns `{ aiGenerated: true, mode, brief }`. Matthew can display that label and brief. It never changes tasks or blocks. The existing shared schemas were left intact for Gilberto's review.

## Kadin: evaluation and spending checks

Integrate the four cases from `eval/bayasaa/cases.json`. Guardrail rejections are expected passes in the injection cases; a harmless answer alone is insufficient if the app mutates tasks. The local tests assert rejection before provider access and unchanged input.

Before a live run, apply the migration, configure verified pricing, and confirm the mock end-to-end workflow. Then follow the team plan: authorize and run 2–3 live cases first, inspect usage, and only then consider the full evaluation. Run baseline calls through the same usage wrapper so they share the $8 limit.

After each run, export **all** usage rows as a JSON array from an admin session:

```sql
select coalesce(json_agg(t), '[]'::json) from public.llm_usage_log as t;
```

Then summarize the saved export without printing identifiers or content:

```sh
npm run usage:summary -- /path/to/usage-export.json 2026-11
```

The report includes call counts, failures, token totals, total latency, actual logged cost, unresolved holds, and remaining budget. An unresolved hold means cost is not final. Treat the report as a snapshot; only the database reservation is the authority for permitting a new paid request. Do not commit exports containing real user identifiers.

## Presentation notes, Nov 30–Dec 2

Prepare two slides after evaluation:

1. **Usage and cost:** number of app/baseline calls, input/output tokens, total cost, latency, failed calls, remaining budget, and any unresolved usage. Separate mock results from live results. Do not claim fake-provider test costs are actual spending.
2. **Risks and guardrails:** server-only key, synthetic data, usage-table privacy policy, input/output validation, two injection cases and their results, $8 reservations, token/attempt caps, and user acceptance before schedule changes. Explain the limits of text patterns and the remaining app-table privacy checks.

AI-use disclosure for the PR: Codex implemented the usage helpers/migration, guardrails, brief prompt/mock service, evaluation cases, tests, and this handoff. Verification uses `npm run check`, the focused tests, and standalone database checks; production integration still needs the owners' review. Every teammate should review and be able to explain the code. No commits, deployment, or real-model evaluation are performed automatically.
