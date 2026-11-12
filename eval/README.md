# eval/

Owner: **Kadin** (test cases: everyone writes 4 for their own area).

Planned layout (Phase 1–2, see [docs/team-plan.md](../docs/team-plan.md)):

```
eval/
  fixtures/students/   5+ synthetic students as JSON (validated with @shared schemas)
  cases/               20 test cases, each with a clear pass/fail rule (≥2 prompt-injection cases)
  run.ts               loads a student, runs system or baseline, checks results
  results/             committed summaries of each run
  .cache/              cached LLM responses (gitignored)
```

Rules:

- **Synthetic data only.** Fictional names and courses. Nothing about real students.
- Default to `LLM_MODE=mock`. Before a live run, try 2–3 cases, and check spend with Bayasaa after each full run.
- Main metric: % of schedules with zero rule breaks (no overlaps, missed deadlines, or class conflicts). Second metric: valid structured output rate.
