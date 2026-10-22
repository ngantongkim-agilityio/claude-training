---
name: ship-issue
description: Implement an approved plan for one GitLab issue — code and tests on a feature branch, pnpm check gate, self-review plus one independent reviewer pass, then a commit and GitLab MR, each behind its own explicit approval. Use after the plan is approved, e.g. "ship issue 23", "implement issue 23".
argument-hint: "<issue-iid>"
---

# Ship an issue

Delivery lane for one GitLab issue, `#<iid>`, with an approved plan from
`plan-issue`. Workflow rules live in `CONTRIBUTING.md` (branch from `main`
as `<type>/<slug>`, one ticket per MR, validation commands, squash-merge,
all threads resolved) and `CLAUDE.md` (never push to `main`, never
force-push, no secrets, verify before claiming done); this skill orders
them. It duplicates none of them.

## Precheck (all mandatory, else stop)

1. A plan for this issue was approved in conversation. No approved plan →
   stop and run `plan-issue <iid>` first.
2. You are on (or will create, only after plan approval) `<type>/<slug>`
   from `main`. Never work on `main` itself.

## Procedure

1. **Implement.** Follow the approved plan step by step; each step's
   `verify:` command must actually be run and its output observed. Bug
   fixes: failing test first, with the issue number in a comment. Keep the
   diff small (about 100 lines guideline); tests go in the same commit as
   the code. Package commands use pnpm exclusively.
2. **Gate.** Run the workspace gate from `CONTRIBUTING.md` (`pnpm check`,
   or `pnpm --filter @repo/api check` when the change is API-only). Keep
   the real output for the MR Testing section. On failure, fix and re-run;
   never skip the gate.
3. **Review.** Self-review the full diff against the plan's scope (no
   opportunistic refactors, no drive-bys, no secrets or debug leftovers),
   then one independent reviewer pass in a separate lane. Record every
   finding as fixed (with location) or explicitly rebutted with a reason.
4. **Commit — approval 1.** Show the full diff (or a tight per-file summary
   plus the diff of every non-trivial file) and the proposed commit
   message, `type(scope): imperative subject`. Wait for explicit "approve".
   Only then commit, exactly as approved. This approval covers the commit
   and nothing else.
5. **Push — approval 2.** State the exact push command (`git push -u origin
<branch>`, feature branch only). Wait for a separate explicit "approve".
   Only then push. Never push to `main`. Never force-push (`--force`,
   `--force-with-lease`, `-f`); if the remote rejects, report the exact
   error and stop. This approval covers the push and nothing else.
6. **MR — approval 3.** Show the draft title (same subject style as the
   commit) and the description: Summary, Changes, Testing (real results
   from step 2), Risks, and `Related to <full issue URL>`. Wait for a
   separate explicit "approve". Only then create the MR against `main`.
   This approval covers MR creation and nothing else.
7. **Stop.** Never merge the MR, never mark the issue done, never tag.
   Report the MR URL and end.

## Prohibited

Pushing to `main`, force-pushing in any form, merging an MR, bypassing or
disabling hooks (`block-forbidden-command.mjs`, Husky `pre-push`) or permission
restrictions, and treating an approval for one of steps 4–6 as
authorization for another. Each gate needs its own explicit approval in
this conversation.

## Test and validation claims

Quote real output only. The MR Testing section carries the observed gate
results; anything not run is labeled as not run, never as passing.
