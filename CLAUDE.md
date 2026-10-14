# CLAUDE.md — claude-training

Shared Claude Code instructions for this repository. See also [CONTRIBUTING.md](CONTRIBUTING.md) for setup and contribution workflow, and [README.md](README.md) for the training plan.

## Repository structure

- `README.md` — 15-day Developer-track training plan (schedule, checkpoints, skill checklist).
- `CLAUDE.md` — this file: shared instructions for Claude Code sessions.
- `CONTRIBUTING.md` — local setup, validation commands, contribution guidelines.
- `package.json` / `package-lock.json` — Node.js workspace root (npm workspaces, Husky + Turborepo).
- `turbo.json` — Turborepo pipeline (`check`, `build`, `lint`).
- `apps/` — workspace packages (currently empty, tracked via `.gitkeep`; per-app `CLAUDE.md` added when apps exist).
- `.husky/pre-push` — Git hook blocking pushes to `main` and non-fast-forward updates.
- `.claude/settings.json` — Claude Code permissions and PreToolUse hook wiring.
- `.claude/hooks/block-main-push.sh` — Claude Code guard blocking `git push` to `main` / force pushes.

This is currently a docs-only workspace (no application code). When apps are added, extend `turbo.json` tasks and per-app scripts.

## Development commands

- `npm install` — install dependencies and set up Husky hooks (via `prepare`).
- `npx turbo --version` — verify Turborepo installation.
- `npx turbo run check --dry-run` — validate `turbo.json` without executing tasks.
- `npx turbo run check` — run workspace `check` tasks (no-op until apps define `check` scripts).

## Shared rules

1. **Never push directly to `main`.** All work goes on a feature branch (`claude/<slug>`) and merges via merge request. A local Husky hook blocks `git push` to `main` and non-fast-forward updates; a Claude Code hook blocks `git push` to `main` and `--force` variants inside Claude sessions; GitLab branch protection enforces this server-side (local hooks are fast feedback, protection is the real gate).
2. **Never force-push** (`--force`, `--force-with-lease`, `-f`). Blocked by Claude hook and rejected as non-fast-forward by the Husky hook; GitLab push rules are the authoritative enforcement.
3. **Plan then implement.** Non-trivial work: explore first, write/confirm a plan, then implement.
4. **Verify before claiming done.** `npx turbo run check` (when applicable), diff reviewed, no unrelated changes in the MR. No `Makefile` or `pre-commit` is used in this repository.
5. **Keep MRs focused.** One ticket per MR, squash-merged. All discussion threads resolved before merge.
6. **Do not commit secrets.** No tokens, keys, or credentials in code, docs, or logs.
7. **Match surrounding style.** Docs use GitHub-flavored Markdown; shell scripts use `#!/bin/sh` (POSIX, macOS-compatible).
