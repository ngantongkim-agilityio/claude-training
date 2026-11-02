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
- Creating a PR requires explicit user approval. Show the draft title and description first. Never merge a PR or transition a Jira ticket, and never tag except through `/release`.

## Releases

- One repo-wide annotated tag per release on `main`, independent of the app `package.json` versions. Tag only through `/release`, behind explicit approval; the first release is `v0.1.0`.
- **Release tag:** matches `^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`.
- **Version bump:** any `feat` PR in the range bumps the minor version; everything else bumps the patch. No major bump is ever automatic: a breaking change (`feat!`, `fix!`) still follows its type and is listed under Deploy notes. `/release` refuses any other version, so moving to a new major version needs a rule change in its own ticket.
- **Previous release tag:** the highest release tag, by numeric version, that is lower than the requested version and on the release commit or an ancestor of it.
- **Release range:** commits reachable from the release commit and not from the previous release tag. With no previous release tag, it is every commit reachable from the release commit. A PR is in the range when its merge commit is in that set, regardless of dates.
- **Notes:** `docs/releases/vX.Y.Z.md`, merged through a `docs/release-vX.Y.Z` PR (`-refresh` for an update) into `main` before the tag. That PR has no Jira ticket of its own. Under `# vX.Y.Z`, stating only what PR titles, PR bodies and Jira summaries say:
  - `## Features`, `## Fixes`: from `feat` and `fix` titles, one line per ticket with its KAN key.
  - `## Deploy notes`: env, data and config steps, plus every breaking change (`!` in the title), or `None.`
  - `## Tickets`: each as `KAN-<n> summary (status)`, marking carry-over.
  - `## Extra`: every other PR, including any with no ticket, as `#<number> title`.
- Push only the single tag to `origin`, never `--tags` and never to `gitlab`.
- **Ticket link:** a PR's ticket is the key after the first `Jira ticket:` or `Jira:` label anywhere in its body that is followed by a key matching `KAN-[0-9]+`, bare, backticked or as a `[KAN-<n>](…)` link, ignoring `*` around the label. Skip labels without a key and ignore every other KAN key in the body.

### Reading a release range

`<repo>` is `ngantongkim-agilityio/claude-training`. Use these forms as written: `--paginate` runs the filter once per page, so `join` is what makes every page one list, and the command hook blocks `--jq '.[].sha'`.

1. **Tags:** `gh api --paginate "repos/<repo>/tags?per_page=100" --jq 'map(.name + " " + .commit.sha) | join("\n")'`
2. **Previous release tag of `<ref>`:** take release tags lower than the requested version, highest first. The first where `gh api repos/<repo>/compare/<candidate>...<ref> --jq .status` prints `ahead` or `identical` is the previous release tag. None means a first release.
3. **Range:** the set for a ref is `gh api --paginate "repos/<repo>/commits?sha=<ref>&per_page=100" --jq 'map(.sha) | join("\n")' | sort -u`. With a previous release tag, the range is `comm -23 <(<set for ref>) <(<set for previous tag>)`. On a first release, it is the set for the ref.
4. **PRs:** `gh pr list --repo <repo> --state merged --base main --limit 200 --json number,title,body,mergeCommit`. With a previous release tag, add `--search "merged:>=<YYYY-MM-DD>T00:00:00Z"` for the day, UTC, of `gh api repos/<repo>/commits/<previous tag> --jq .commit.committer.date`; this only narrows the list. Keep a PR only when its `mergeCommit.oid` exactly matches a line of the range. Do not add `--jq` to `gh pr list`.

## Jira tickets

- Create Jira tickets with the `create-ticket` skill, which uses the Atlassian MCP.
- Creating a ticket requires explicit user approval. Show the draft summary, type, priority, labels, and description first. Never edit, transition, comment on, or delete existing tickets unasked.

## Protections

Never weaken or bypass repository protections. Follow `CLAUDE.md`, `CONTRIBUTING.md`, `.claude/hooks/block-forbidden-command.mjs`, and `.claude/settings.json`.
