# Git conventions

One ticket = one branch = one PR. Never push to `main`, force-push, or bypass hooks.

## Remotes

- `origin` is GitHub (`ngantongkim-agilityio/claude-training`): the primary remote for branches, PRs and CI.
- `gitlab` is a mirror. Never push feature branches there, never open MRs there, and never treat it as a source of work or truth.

## Branches

- Create branches from `main`: `git checkout -b <type>/<slug> main`.
- Format: `<type>/<slug>`, e.g. `docs/simplify-contributing`, `feat/auth-retry`, `fix/login-error`. Choose `type` based on the dominant change.
- One ticket per branch. Never mix unrelated work or commit directly to `main`.
- Tickets are Jira tickets in project KAN. Reference the ticket by its Jira key (for example `KAN-6`) in the PR title or body; never reference a GitHub or GitLab issue. The branch name does not need a ticket ID.

## Commits

- Format: `type(scope): description`; scope is optional and `!` marks a breaking change.
- Allowed types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `ci`, `build`.
- Use one English subject line, an imperative description, at most 72 characters, and no trailing period.
- No commit body, trailers, or AI attribution. Keep each commit to one logical change.

## Pull requests

- Open PRs on `origin` against `main`, with a title matching the commit-subject format.
- PRs use `.github/pull_request_template.md`: fill every section and pass it with `gh pr create --body-file <file>` (see the `create-pr` skill). `--fill`, `--body`, and `--web` do not apply the template.
- Resolve all review threads before merging, and delete the branch after merging.
- Creating a PR requires explicit user approval. Show the draft title and description first. Never merge a PR, transition a Jira ticket, or tag.

## Jira tickets

- Create Jira tickets with the `create-ticket` skill, which uses the Atlassian MCP.
- Creating a ticket requires explicit user approval. Show the draft summary, type, priority, labels, and description first. Never edit, transition, comment on, or delete existing tickets unasked.

## Protections

Never weaken or bypass repository protections. Follow `CLAUDE.md`, `CONTRIBUTING.md`, `.claude/hooks/block-forbidden-command.mjs`, and `.claude/settings.json`.
