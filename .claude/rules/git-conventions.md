# Git conventions

One ticket = one branch = one merge request. Never push to `main`, force-push, or bypass hooks.

## Branches

- Create branches from `main`: `git checkout -b <type>/<slug> main`.
- Format: `<type>/<slug>`, e.g. `docs/simplify-contributing`, `feat/auth-retry`, `fix/login-error`. Choose `type` based on the dominant change.
- One ticket per branch. Never mix unrelated work or commit directly to `main`.
- Reference the ticket in the MR title/body (`Closes #N`); the branch name does not need a ticket ID.
- `origin` is GitLab; `github` is a mirror. Do not treat the mirror exception as permission for routine direct pushes to `main`.

## Commits

- Format: `type(scope): description`; scope is optional and `!` marks a breaking change.
- Allowed types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `ci`, `build`.
- Use one English subject line, an imperative description, at most 72 characters, and no trailing period.
- No commit body, trailers, or AI attribution. Keep each commit to one logical change.

## Merge requests and pull requests

- Use a title matching the commit-subject format.
- Use `Summary`, `Changes`, and `Testing` sections where appropriate; reference related tickets.
- GitHub PRs use `.github/pull_request_template.md`: fill every section and pass it with `gh pr create --body-file <file>` (see the `create-pr` skill). `--fill`, `--body`, and `--web` do not apply the template.
- Use the GitLab project's default merge method. Resolve all discussion threads before merging.
- Enable **Delete source branch** when merging.
- Creating or submitting an MR requires explicit user approval. Show the draft title and description first. Never merge an MR, mark an issue done, or tag.

## Protections

Never weaken or bypass repository protections. Follow `CLAUDE.md`, `CONTRIBUTING.md`, `.claude/hooks/block-forbidden-command.mjs`, and `.claude/settings.json`.
