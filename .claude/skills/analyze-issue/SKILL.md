---
name: analyze-issue
description: Inspect one GitLab issue in this repo for readiness — clear ask, acceptance criteria or reproduction steps, dependencies, scope fit for one MR — investigate the repo for facts, and report what is missing or ask only genuine decisions. Use when asked whether an issue is ready, e.g. "is issue 23 ready?", "analyze issue 23", "what's missing on issue 23".
argument-hint: "<issue-iid>"
---

# Analyze an issue

Read-only readiness check for one GitLab issue, `#<iid>`. The rules behind
readiness live in `CONTRIBUTING.md` (one ticket per MR, focused changes) and
`CLAUDE.md` (shared rules); this skill is the order to apply them in, not a
copy of them.

## Procedure

1. **Read the issue.** Get the issue by IID with full details, plus its
   discussion notes. If the issue does not exist, stop and say so.
2. **Readiness check.** Against `CONTRIBUTING.md`: a clear ask; acceptance
   criteria (features) or reproduction steps (bugs); small enough for one MR.
   If any element is missing, record it as a gap — do not fill it in by
   guessing.
3. **Dependencies.** For each `Depends on #m` (or equivalent link) in the
   description, read that issue. If any is not closed, stop and report which
   one blocks, and what state it is in.
4. **Investigate the repo for facts.** Current behavior, related code and
   tests, past MRs, and — for API work — `apps/tax-invoice-api/CLAUDE.md`
   and the contract source of truth it names
   (`apps/tax-invoice-api/docs/APIs_DESIGN.md`). Anything the repo already
   answers is a fact, never a question.
5. **Report.** One message: ready or not ready; the gap list (if any); the
   facts found with `path:line` or MR references. If ready, end with:
   `plan-issue <iid>` is the next step.

## Decisions (only when ready-adjacent)

If exactly the decision is the user's to make (product intent, scope
tradeoff), ask one question at a time, each with a labeled recommendation
and one line of why. Never stack questions. Never ask what step 4 already
answered.

## GitLab writes (exception, never default)

This skill ends at the report. It updates the issue or posts a note **only**
when the user explicitly approves a specific write after reviewing its exact
content: show the full text to be posted, wait for "approve", then perform
that write and nothing else. An approval of the report is not an approval
to write.

## Test and validation claims

Every claim about behavior, tests, or validation in the report must rest on
actual output observed in this session. Never assert a test passes, a bug
reproduces, or a check is green without the command output to quote.
