# Contributing to claude-training

## Prerequisites

- Node.js v24 / pnpm 10.12.4 (`packageManager` in [package.json](package.json); Corepack can install it: `corepack prepare pnpm@10.12.4 --activate`)
- Git

## Local setup

1. Clone the repository:
   ```bash
   git clone <gitlab-url> claude-training
   cd claude-training
   ```
2. Install dependencies (also sets up Husky hooks via `prepare`):
   ```bash
   pnpm install
   ```
3. Read [CLAUDE.md](CLAUDE.md) for shared Claude Code instructions and [README.md](README.md) for the training plan.

## Validation commands

No `Makefile` or `pre-commit` is used in this repository.

```bash
pnpm install              # install dependencies and set up hooks
pnpm --filter @repo/api check  # API quality gate: typecheck + lint + tests (needs test env vars, see apps/tax-invoice-api/.env.sample)
pnpm check                # turbo: run workspace check tasks
pnpm exec turbo run check --dry-run  # validate turbo.json without executing tasks
```

## Contribution workflow

1. Create a feature branch from `main`: `git checkout -b claude/<short-slug> main`.
2. Make focused changes (one ticket per branch).
3. Run validation commands above.
4. Open a merge request against `main`. Never push directly to `main` — a local Husky hook blocks `git push` to `main` and non-fast-forward updates, a Claude Code hook blocks `git push` to `main` and force-push flags inside Claude sessions, and GitLab branch protection rejects it server-side. The original `pre-commit run --all-files` criterion from the ticket is superseded by this workspace setup and is not applicable.
5. Never force-push. Resolve all discussion threads before merge. MRs are squash-merged.

## Hooks

- **Claude Code** (`.claude/hooks/block-main-push.sh`, wired via `.claude/settings.json` `hooks.PreToolUse`): reads the `Bash` tool JSON from stdin and blocks `git push` targeting `main` (`origin main`, `HEAD:main`, `main`) or force variants (`--force`, `--force-with-lease`, `-f`). Exit 2 + stderr on block. Only active inside Claude Code sessions; only this layer sees `--force` flags.
- **Husky Git hook** (`.husky/pre-push`): reads `pre-push` stdin `<local_ref> <local_sha> <remote_ref> <remote_sha>`, blocks any `remote_ref == refs/heads/main`, and rejects non-fast-forward updates via `git merge-base --is-ancestor` (detects the effect of a force push, not the flag — flags are not passed to `pre-push`). Installed via `npm install` → `prepare` (`husky`).
- These are local fast feedback only; **GitLab branch protection and push rules are the authoritative enforcement** (see below).

## GitLab settings (Maintainer — manual)

The following are **not** changed by this MR and require a Maintainer to configure in the GitLab UI:

1. **Protect `main`:** Settings → Repository → Protected branches → `main` (Allowed to push: No one; Allowed to merge: Maintainers).
2. **Squash merging:** Settings → Merge requests → Squash commits.
3. **Require resolved discussions:** Settings → Merge requests → "All threads must be resolved before merging."

Verify via `GET /api/v4/projects/:encoded_id` (`squash_option`, `only_allow_merge_if_all_discussions_are_resolved`, `protected_branches`) and UI screenshots.
