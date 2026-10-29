# Contributing to claude-training

## Prerequisites

- Node.js (LTS recommended)
- pnpm 10.12.4 (see `packageManager` in [package.json](package.json); install with `corepack prepare pnpm@10.12.4 --activate`)
- Git

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url> claude-training
   cd claude-training
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. For API work, copy `apps/tax-invoice-api/.env.sample` to `apps/tax-invoice-api/.env` and fill in local values. Never commit real secrets.
4. Read [CLAUDE.md](CLAUDE.md) for shared working instructions and [README.md](README.md) for the training plan.

## Checks

```bash
pnpm check                          # run workspace checks via Turborepo
pnpm --filter @repo/api check       # API quality gate: typecheck + lint + tests (needs API env vars, see above)
```

## Workflow

1. Pick or file a [GitHub issue](https://github.com/ngantongkim-agilityio/claude-training/issues) using the bug, feature, or chore form (in Claude Code: `/create-issue`).
2. Create a task branch from `main` and make focused changes (one ticket per branch).
3. Run the relevant checks above.
4. Push the branch to `origin` (GitHub) and open a pull request against `main`. PRs use [.github/pull_request_template.md](.github/pull_request_template.md) and reference the Jira key (for example `KAN-6`). The `gitlab` remote is a mirror; never push feature branches there.

Follow [.claude/rules/git-conventions.md](.claude/rules/git-conventions.md) for branch naming, commit format, and push protections.

## Hooks

- **Claude Code `block-forbidden-command`** (`PreToolUse` on `Bash`): shell-aware enforcement of the push policies, blocking `git push` to `main` and force pushes, covering chained/nested commands, refspec forms, and bypass attempts. Exits 2 with a reason to block, 0 to allow.
- **Claude Code `format-on-edit`** (`PostToolUse` on `Edit|Write`): formats only the edited file — `eslint --fix` plus Prettier for JS/TS under `apps/tax-invoice-api/`, Prettier only for other supported files. It never fails or blocks the edit.
- **Claude Code `notify-on-finish`** (`Stop`): shows a macOS desktop notification via `osascript` when Claude finishes. It always exits 0 and never blocks Claude Code.
