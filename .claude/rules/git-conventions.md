# Git conventions

One ticket = one branch = one merge request. Never push to `main`, force-push, or bypass hooks.

## Branches

- Create branches from `main`: `git checkout -b <type>/<slug> main`.
- Default to `claude/<slug>`; `feat/`, `fix/`, or other meaningful type prefixes are also accepted.
- One ticket per branch. Never mix unrelated work or commit directly to `main`.
- Reference the ticket in the MR title/body (`Closes #N`); the branch name does not need a ticket ID.
- `origin` is GitLab; `github` is a mirror. Do not treat the mirror exception as permission for routine direct pushes to `main`.

## Commits

- Format: `type(scope): description`; scope is optional and `!` marks a breaking change.
- Allowed types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `ci`, `build`.
- Use one English subject line, an imperative description, at most 72 characters, and no trailing period.
- No commit body, trailers, or AI attribution. Keep each commit to one logical change.

## Merge requests

- Use a title matching the commit-subject format.
- Use `Summary`, `Changes`, and `Testing` sections where appropriate; reference related tickets.
- Use the GitLab project's default merge method. Resolve all discussion threads before merging.
- Enable **Delete source branch** when merging.
- Creating or submitting an MR requires explicit user approval. Show the draft title and description first. Never merge an MR, mark an issue done, or tag.

## Protections

Never weaken or bypass repository protections. Follow `CLAUDE.md`, `CONTRIBUTING.md`, `.claude/hooks/block-main-push.sh`, `.claude/settings.json`, and `.husky/pre-push`.
