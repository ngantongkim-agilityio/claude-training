---
name: ship-ticket
description: Deliver one implemented and reviewed Jira ticket (project KAN) — commit, push the feature branch to origin, and open the GitHub PR, each behind its own explicit approval. Use after implement-ticket reports a green gate and a reviewer verdict, e.g. "ship KAN-6", "open the PR for KAN-6".
argument-hint: "<KAN-key>"
---

# Ship a ticket

Delivery lane for one Jira ticket, `KAN-<n>`, after `implement-ticket`.
Workflow rules live in `CONTRIBUTING.md` (one ticket per PR, validation
commands, all threads resolved) and `CLAUDE.md` (never push to `main`, never
force-push, no secrets, verify before claiming done); this skill orders them.
It duplicates none of them.

## Precheck (all mandatory, else stop)

1. `implement-ticket` ran for this ticket in this conversation, the gate
   passed on the current working tree, and the reviewer's verdict is
   **approve** or **approve with nits**. Otherwise stop and run
   `implement-ticket <KAN-key>`.
2. You are on the ticket's `<type>/<slug>` branch, not `main`.

## Procedure

1. **Commit — approval 1.** Show the full diff (or a tight per-file summary
   plus the diff of every non-trivial file) and the proposed commit
   message, `type(scope): imperative subject`. Wait for explicit "approve".
   Only then commit, exactly as approved. This approval covers the commit
   and nothing else.
2. **Push — approval 2.** State the exact push command (`git push -u origin
<branch>`, feature branch only; `origin` is GitHub). Wait for a separate
   explicit "approve". Only then push. Never push to `main` or to the
   `gitlab` mirror. Never force-push (`--force`, `--force-with-lease`, `-f`);
   if the remote rejects, report the exact error and stop. This approval
   covers the push and nothing else.
3. **PR — approval 3.** Open the pull request against `main` per the
   `create-pr` skill, with the Jira key and its link in the Summary and the
   real gate results from `implement-ticket` under Testing. This approval
   covers PR creation and nothing else.
4. **Stop.** Never merge the PR, never transition the Jira ticket, never
   tag. Report the PR URL and end.

## Prohibited

Pushing to `main`, force-pushing in any form, merging a PR, bypassing or
disabling hooks (`block-forbidden-command.mjs`) or permission
restrictions, and treating an approval for one of steps 1–3 as
authorization for another. Each gate needs its own explicit approval in
this conversation.

## Test and validation claims

Quote real output only. The PR Testing section carries the observed gate
results; anything not run is labeled as not run, never as passing.
