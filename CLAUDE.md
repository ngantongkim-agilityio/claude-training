# CLAUDE.md — claude-training

Shared Claude Code instructions for this repository. See also [CONTRIBUTING.md](CONTRIBUTING.md) for setup and contribution workflow, and [README.md](README.md) for the training plan.

## Repository structure

- `README.md` — 15-day Developer-track training plan (schedule, checkpoints, skill checklist).
- `CLAUDE.md` — this file: shared instructions for Claude Code sessions.
- `CONTRIBUTING.md` — local setup, validation commands, contribution guidelines.
- `package.json` / `pnpm-lock.yaml` — pnpm workspace root (Turborepo).
- `pnpm-workspace.yaml` — workspace globs (`apps/*`, `packages/*`).
- `turbo.json` — Turborepo pipeline (`check`, `build`, `lint`, `test`, `typecheck`).
- `apps/` — workspace packages (`tax-invoice-api`: Tax Invoice API; per-app `CLAUDE.md` inside each app).
- `packages/` — shared configs (`typescript-config`, `eslint-config`).
- `exercises/` — Day 01–03 training materials.
- `.claude/settings.json` — Claude Code permissions and PreToolUse hook wiring.
- `.claude/hooks/block-forbidden-command.mjs` — Claude Code guard blocking `git push` to `main` / force pushes.

When adding apps, give each one `check`, `build`, and `lint` scripts so the `turbo.json` tasks cover them.

## Development commands

- `pnpm install` — install dependencies. Requires pnpm 10.12.4 (`corepack prepare pnpm@10.12.4 --activate`).
- `pnpm check` — run workspace `check` tasks via Turborepo.
- `pnpm --filter @repo/api <script>` — run one API script (`dev`, `test`, `typecheck`, `lint:check`, `check`). API env vars come from `apps/tax-invoice-api/.env` (copy from `.env.sample`; never commit real values).

## Shared rules

1. **Never push directly to `main`.** All work goes on a feature branch (`<type>/<slug>`, see `.claude/rules/git-conventions.md`) and merges via merge request. A Claude Code hook blocks `git push` to `main` and `--force` variants inside Claude sessions; GitLab branch protection enforces this server-side (local hooks are fast feedback, protection is the real gate).
2. **Never force-push** (`--force`, `--force-with-lease`, `-f`). Blocked by Claude hook; GitLab push rules are the authoritative enforcement.
3. **Plan then implement.** Non-trivial work: explore first, write/confirm a plan, then implement.
4. **Verify before claiming done.** `pnpm check` (when applicable), diff reviewed, no unrelated changes in the MR. No `Makefile` or `pre-commit` is used in this repository.
5. **Keep MRs focused.** One ticket per MR, squash-merged. All discussion threads resolved before merge.
6. **Do not commit secrets.** No tokens, keys, or credentials in code, docs, or logs.
7. **Match surrounding style.** Docs use GitHub-flavored Markdown; shell scripts use `#!/bin/sh` (POSIX, macOS-compatible).
