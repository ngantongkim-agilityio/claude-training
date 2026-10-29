---
description: Summarise where the repo stands — branch, uncommitted work, open GitHub PRs, Jira tickets, blockers, next step. Read-only.
argument-hint: "[<KAN-key>]"
---

# Repository check

Report the current state of this repository. Read only: change nothing, create nothing, never fetch, pull, push, commit, or modify files.

## Procedure

1. **Git (local information only).** Report from `git status -sb`, `git branch -vv`, and `git log --oneline -5`: current branch, ahead/behind its upstream as locally known, uncommitted or untracked files, and branches that look merged or lack a remote. Do **not** fetch, pull, or change any ref to verify — if local information is insufficient (e.g. upstream freshness unknown), say so explicitly instead of assuming.
2. **Pull requests.** List open PRs on `origin` (`gh pr list --repo ngantongkim-agilityio/claude-training`, when `gh` is authenticated): title, author, and whether each waits on review, CI, or merge. Read-only calls only — never create, update, approve, merge, or comment.
3. **Jira tickets.** Read-only, through the Atlassian MCP. If an argument was given (`$ARGUMENTS` holds a Jira key), report that ticket's status, readiness gaps, and "is blocked by" links. Otherwise list open tickets in project KAN (`project = KAN AND statusCategory != Done`) grouped by status, noting anything blocking or blocked. Never edit, transition, or comment.
4. **Blockers.** Anything that stops progress: failing gates, unapproved plans, missing information, environment problems. Quote actual output or state exactly what was observed.
5. **Next step.** One recommendation: the highest-priority ready ticket, a Done card waiting for verification, a branch to clean up, or an approval to request.

## Rules

- Every claim rests on observed output. Never assert a test passes, a branch is current, or an MR is mergeable without the evidence in front of you.
- Arguments given: $ARGUMENTS
