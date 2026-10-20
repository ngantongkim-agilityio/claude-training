---
description: Summarise where the repo stands — branch, uncommitted work, open GitLab MRs and issues, blockers, next step. Read-only.
argument-hint: "[<issue-iid>]"
---

# Repository check

Report the current state of this repository. Read only: change nothing, create nothing, never fetch, pull, push, commit, or modify files.

## Procedure

1. **Git (local information only).** Report from `git status -sb`, `git branch -vv`, and `git log --oneline -5`: current branch, ahead/behind its upstream as locally known, uncommitted or untracked files, and branches that look merged or lack a remote. Do **not** fetch, pull, or change any ref to verify — if local information is insufficient (e.g. upstream freshness unknown), say so explicitly instead of assuming.
2. **Merge requests.** List open MRs for this project (GitLab MCP tools when available, else the `glab` CLI if authenticated): title, author, and whether each waits on review, CI, or merge. Read-only calls only — never create, update, approve, merge, or comment.
3. **Issues.** If an argument was given (`$ARGUMENTS` holds an issue IID), report that issue's state, readiness gaps, and blockers. Otherwise list open issues grouped by state, noting anything blocking or blocked.
4. **Blockers.** Anything that stops progress: failing gates, unapproved plans, missing information, environment problems. Quote actual output or state exactly what was observed.
5. **Next step.** One recommendation: the highest-priority ready issue, a Done card waiting for verification, a branch to clean up, or an approval to request.

## Rules

- Every claim rests on observed output. Never assert a test passes, a branch is current, or an MR is mergeable without the evidence in front of you.
- Arguments given: $ARGUMENTS
