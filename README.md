# Amadeus

An LLM-powered planner for college students. Add your tasks, classes, and commitments. Amadeus estimates how long each task takes, ranks them, builds a schedule around your classes that meets every deadline, checks it for conflicts, and explains the plan. You accept or reject each suggestion, and a morning brief sums up your day.

Built with Expo (React Native + TypeScript), Supabase, and the OpenAI API.

> **Working with an AI assistant?** Read [AGENTS.md](AGENTS.md) first. It has the rules every contributor and agent must follow.

## Team

| Name | Area |
| --- | --- |
| Fernando | App setup, Supabase, scheduler, web build, README |
| Gilberto | LLM connection, schemas, estimates and priorities, the loop, AI-use disclosure |
| Matthew | Screens, demo video |
| Kadin | Synthetic data, test runner, schedule checker, baseline, error analysis |
| Bayasaa | Usage log and monthly limit, guardrails, morning brief prompt, privacy test |

## Setup

Prerequisites: [Node.js](https://nodejs.org/) 22.13+ (24 LTS recommended; see `.nvmrc`), npm, and git.
To run on a device or emulator, also install one of: the Android emulator (Windows/macOS), the iOS simulator (macOS, via Xcode), or the Expo Go app on your phone. A web browser works everywhere.

```bash
git clone https://github.com/Machine-Learning-LLM-Project/Amadeus.git
cd Amadeus
npm install
cp .env.example .env        # Windows (PowerShell): Copy-Item .env.example .env
```

Fill in `.env`:

- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: from the Supabase dashboard (Project Settings → API keys), or ask Fernando.
- `OPENAI_API_KEY`: shared privately within the team. Only needed for live LLM runs.
- Keep `LLM_MODE=mock` unless you are testing LLM features.

**Never commit `.env`.**

## Run the app

```bash
npx expo start
```

Then press `w` for web, `a` for the Android emulator, or `i` for the iOS simulator (macOS), or scan the QR code with Expo Go. Use **Create account** on the sign-in screen the first time. Use a made-up email if you like, since email confirmation is off during development.

## Checks

```bash
npm run check        # typecheck + lint + secret check (also runs in CI on every PR)
npm run check:rls    # privacy test: a second user can't read or change the first user's data
```

## Project layout

| Path | What's there |
| --- | --- |
| `src/app/` | Screens (Expo Router). Tabs: Tasks, Classes, Schedule, Brief |
| `src/components/` | Shared UI components |
| `shared/` | Zod schemas and types shared by the app, backend, and evaluation ([details](shared/README.md)) |
| `supabase/` | Database migrations (tables + Row Level Security) and edge functions |
| `eval/` | Synthetic students, test cases, and the test runner *(coming soon)* |
| `docs/` | [Course requirements](docs/course-requirements.md), [proposal](docs/proposal.md), [team plan](docs/team-plan.md), [API access](docs/api-access.md) |

## Reproduce the evaluation

*TODO (Kadin, Fernando):* how to run the 20 test cases for our system and the baseline, and where results are written.

## Models and usage

*TODO (Bayasaa, Fernando):* models used (`gpt-6-luna` via the course OpenAI project), usage and cost summary from the usage log.

## AI-use disclosure

*TODO (Gilberto):* full disclosure for the final submission.

- **Project scaffold** (Expo setup, `shared/` schemas, `.env.example`, `.gitignore`, CI, AGENTS.md, docs formatting): generated with Claude Code, then reviewed and run locally by Fernando.
