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
- `docs/` — planning docs: `features/<slug>/intent.md` (what, why, constraints; links the supporting spec and Jira tickets) and `tickets/` (a short summary per Jira ticket for readers without Jira access; Jira stays authoritative). API contracts stay in `apps/tax-invoice-api/docs/`.
- `exercises/` — Day 01–03 training materials.
- `.claude/settings.json` — Claude Code permissions and PreToolUse hook wiring.
- `.claude/hooks/block-forbidden-command.mjs` — Claude Code guard blocking `git push` to `main` / force pushes.
- `.claude/agents/` — project subagents, read-only by instruction: `business-analyst` (drafts a Jira ticket from a vague brief for `create-ticket`) and `code-reviewer` (independent review of a branch, diff, or PR).
- `.claude/skills/` — project skills for the Jira ticket workflow: `create-ticket` → `analyze-ticket` → `plan-ticket` → `implement-ticket` → `ship-ticket` (one ticket, `KAN-<n>`), plus `create-pr` (GitHub PR from the template).
- `.github/ISSUE_TEMPLATE/` — GitHub issue forms (`bug`, `feature`, `chore`), kept as they are; tasks are not tracked in GitHub Issues.
- `.github/pull_request_template.md` — GitHub PR description template (Summary, Changes, Testing, Risks, Checklist).
- `.github/workflows/` — Claude PR assistant (`claude.yml`: `@claude` in issue/PR comments, collaborators only, answer-only, `claude-review` environment) and CI quality gate (`ci.yml`: tracked-secret check and `pnpm check` on pushes/PRs to `main`).

Tasks are tracked as Jira tickets in project KAN on `claude-training-dev.atlassian.net`, the source of truth for requirements, acceptance criteria, dependencies and status; read and write it through the Atlassian MCP. `docs/tickets/` holds a short summary of each ticket. `origin` is GitHub, the primary remote for code, PRs and CI; `gitlab` is a mirror that is never pushed to for feature work.

When adding apps, give each one `check`, `build`, and `lint` scripts so the `turbo.json` tasks cover them.

## Development commands

- `pnpm install` — install dependencies. Requires pnpm 10.12.4 (`corepack prepare pnpm@10.12.4 --activate`).
- `pnpm check` — run workspace `check` tasks via Turborepo.
- `pnpm --filter @repo/api <script>` — run one API script (`dev`, `test`, `typecheck`, `lint:check`, `check`). API env vars come from `apps/tax-invoice-api/.env` (copy from `.env.sample`; never commit real values).

## Shared rules

1. **Never push directly to `main`.** All work goes on a feature branch (`<type>/<slug>`, see `.claude/rules/git-conventions.md`) and merges via a pull request on `origin` (GitHub). A Claude Code hook blocks `git push` to `main` and `--force` variants inside Claude sessions. Server-side enforcement needs GitHub branch protection on `main`, which is not enabled yet; until it is, the hook is the only guard.
2. **Never force-push** (`--force`, `--force-with-lease`, `-f`). Blocked by the Claude hook; GitHub branch protection should be the authoritative enforcement once enabled.
3. **Plan then implement.** Non-trivial work: explore first, write/confirm a plan, then implement.
4. **Verify before claiming done.** `pnpm check` (when applicable), diff reviewed, no unrelated changes in the PR. No `Makefile` or `pre-commit` is used in this repository.
5. **Keep PRs focused.** One ticket per PR, squash-merged. All review threads resolved before merge.
6. **Do not commit secrets.** No tokens, keys, or credentials in code, docs, or logs.
7. **Match surrounding style.** Docs use GitHub-flavored Markdown; shell scripts use `#!/bin/sh` (POSIX, macOS-compatible).
