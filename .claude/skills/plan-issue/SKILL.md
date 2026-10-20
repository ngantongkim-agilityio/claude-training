---
name: plan-issue
description: Write a concise implementation plan for a ready GitLab issue — affected files, API contract implications, steps each with a verify command, test strategy — then stop for approval. Use when asked to plan an issue, e.g. "plan issue 23", "how would you build issue 23".
argument-hint: "<issue-iid>"
---

# Plan an issue

Planning pass for one GitLab issue, `#<iid>`. This skill is **write-free**:
it reads, investigates, and presents a plan. It creates no branch, no
commit, no push, and no GitLab write. Branching and implementation begin
only after the user approves the plan, outside this skill.

## Precheck (all mandatory, else stop)

1. The issue is ready: acceptance criteria or reproduction steps are present.
   Absent → stop and hand back to `analyze-issue <iid>`.
2. The working tree contains no unrelated changes you would build on top of.
   Report `git status` as observed; do not clean anything up yourself.
3. Assess whether local `main` looks current from local information only
   (`git status -sb`, `git log`). Do **not** fetch, pull, or change any ref
   to verify. If local information is insufficient to tell, say so
   explicitly in the plan rather than assuming it is current.

## Procedure

1. **Investigate.** Affected files or modules, with `path:line` references.
   For API work, state contract implications against the source of truth
   named in `apps/tax-invoice-api/CLAUDE.md`
   (`apps/tax-invoice-api/docs/APIs_DESIGN.md`): if the plan would change a
   request/response contract without the user's explicit instruction to do
   so, flag it and stop — per that file, contracts change only on explicit
   instruction.
2. **Write the plan.** Scope (in/out), implementation steps in order, each
   step with its own `verify:` command (a real command whose output proves
   the step), test strategy (failing test first for bugs; tests ship in the
   same commit as code), and validation via the workspace gates in
   `CONTRIBUTING.md` (`pnpm check`, `pnpm --filter @repo/api check`). All
   package commands use pnpm exclusively, per the app rules.
3. **Present and stop.** Show the plan, then end the turn with an explicit
   approval request. Do not implement, branch, commit, push, or open an MR
   in this skill under any reading of the approval — approval of the plan
   authorizes a later implementation pass, not writes inside this one.

## Test and validation claims

Every test or validation statement in the plan must be framed as a command
to run (`verify:`), not as a result. Never claim an outcome the session has
not observed.
