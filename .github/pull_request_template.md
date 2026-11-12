## What changed

<!-- One or two sentences. Keep PRs small and merge often. -->

**Area / owner:** <!-- e.g. Scheduler (Fernando), Screens (Matthew), Guardrails (Bayasaa) -->

## How I tested it

<!-- Commands you ran, screens you clicked through, test cases that pass. -->

## AI-use disclosure

<!-- Required by the course. Which tools (Claude Code, Copilot, Codex, Cursor, ChatGPT, none),
     for which parts, and how you checked the output. -->

## Checklist

- [ ] `npm run check` passes (typecheck, lint, secret check)
- [ ] Works with `LLM_MODE=mock` (no real model calls needed to run it)
- [ ] No keys, `.env` files, or personal data; synthetic data and first names only
- [ ] Any LLM call runs server-side, sets a max output length, and logs usage
- [ ] I can explain every line of this PR in the Q&A
