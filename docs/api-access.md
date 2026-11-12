# API access (course OpenAI key)

> Source: the instructor's message with our team's key, copied on 2026-11-12. **The key itself is never stored in this repo.**
> These limits are also encoded in [`shared/constants.ts`](../shared/constants.ts).

## Allowed models

Calls to any other model will be rejected.

| Model | Use |
| --- | --- |
| `gpt-6-luna` | Text: estimates, priorities, explanations, morning brief, baseline |
| `gpt-4o-mini-tts` | Text-to-speech |
| `gpt-transcribe` | Speech-to-text |
| `gpt-4o-mini-transcribe` | Speech-to-text |

## Budget

- **Hard limit: $10 per month.** Once it is reached, requests fail until the limit resets next month, so test with small inputs first.
- **Spend alerts:** all five team members get an automatic email when the team reaches 50%, 80%, and 100% of the budget.
- **Our own limit is lower:** the app blocks new calls at **$8** of logged spend per month (see [team-plan.md](team-plan.md#budget-plan)).

## Keeping the key private

- Share it only within the team.
- Store it in an environment variable named `OPENAI_API_KEY`:
  - locally in `.env` (gitignored; copy from [`.env.example`](../.env.example)),
  - on the server as a Supabase secret.
- Never commit it to GitHub or paste it into shared documents, chat tools, or the demo video.
- Never put it in an `EXPO_PUBLIC_` variable. Those are bundled into the app and anyone can read them.
- If you think it has leaked, tell the instructor right away so it can be revoked and a new one issued.
