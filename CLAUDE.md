@AGENTS.md

## Claude Code notes

- Project settings in `.claude/settings.json` deny reading `.env` files and pre-approve `npm run check` and friends. Put personal overrides in `.claude/settings.local.json` (gitignored).
- The Expo plugin is enabled for this project. Use its skills for Expo/EAS questions before answering from memory.
- Commit messages: short imperative subject, first names only, and keep the `Co-Authored-By` trailer so AI use is visible in history.
