---
name: ship-ticket
description: Deliver one implemented and reviewed Jira ticket (project KAN) — commit, push the feature branch to origin, open the GitHub PR, and run the risk-based review gate, each write behind its own explicit approval. Use after implement-ticket reports a green gate and a reviewer verdict, e.g. "ship KAN-6", "open the PR for KAN-6".
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

**Resume:** if steps 1–3 are done and the branch has an open PR, skip
Precheck 1 and go straight to step 4.

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
   covers PR creation and nothing else. When `create-pr` reports the URL,
   continue to step 4 here.
4. **Review gate.** Needs the PR number, so it follows step 3. Tier: run
   `git diff --name-only --no-renames origin/main...HEAD` and match the
   paths against the `REVIEW.md` **Auth** and **Data** groups. Use
   `origin/main`, because local `main` can be stale; do not move local
   `main`.
   - `standard`: report the gate as skipped and go to Stop.
   - `high`: give the user the exact command, with the real PR number, and
     report **not ready**. Claude never runs it: it is user-triggered and
     billed.

     ```
     /code-review ultra <PR#> --post
     ```

   - Evidence: the URL of the posted ultra review comment and the SHA it
     reviewed, both given by the user. Read it with
     `gh pr view <PR#> --json comments` and match `.comments[].url`; any
     other comment is rejected. In branch mode (the user ran
     `/code-review ultra` with no PR) there is no URL: reject the evidence
     unless it has a clean-tree SHA and the full findings output. Partial
     output or a missing SHA is rejected. In both modes, reject the SHA
     unless `git merge-base --is-ancestor <SHA> HEAD` exits 0.
   - Commits after the reviewed SHA: a fix commit needs a green `pnpm check`
     first, then approvals 1 and 2 again. Run
     `git diff --name-only --no-renames <SHA>..HEAD`. If a listed path is
     an Auth or Data path and also in the tier diff above, the evidence is
     stale and the gate is **not ready** until a new ultra review, unless
     an explicit user approval naming the PR skips it; quote that approval
     verbatim in the disposition comment.
   - Disposition comment: one line per ultra finding, fixed or rebutted
     with a reason, or one line saying it found nothing. Show it in full,
     then post it behind its own explicit approval (approval 4). The gate
     is **not ready** until the evidence exists, a disposition comment
     posted after that evidence covers each of its findings, the evidence
     is not stale (or that comment quotes an approval skipping the new
     review), `git status --porcelain` is empty, and `HEAD` equals
     `headRefOid` from
     `gh pr view <PR#> --json headRefOid`; then it is **ready**.

     ```bash
     gh pr comment <PR#> --repo ngantongkim-agilityio/claude-training --body-file <file>
     ```

   - Not run: a recorded reason alone keeps the gate failed, reported as
     **not ready**. Only an explicit user approval naming the PR continues.
     That approval is quoted verbatim in a disposition comment, posted
     behind approval 4; with the same clean-tree and `headRefOid` checks,
     the gate is then **ready**.
5. **Stop.** Never merge the PR, never transition the Jira ticket, never
   tag. Report the PR URL and the gate result (skipped / ready / not ready)
   and end.

## Prohibited

Pushing to `main`, force-pushing in any form, merging a PR, running the
ultra review yourself, bypassing or disabling hooks
(`block-forbidden-command.mjs`) or permission
restrictions, and treating an approval for one of steps 1–4 as
authorization for another. Each gate needs its own explicit approval in
this conversation.

## Test and validation claims

Quote real output only. The PR Testing section carries the observed gate
results; anything not run is labeled as not run, never as passing.
