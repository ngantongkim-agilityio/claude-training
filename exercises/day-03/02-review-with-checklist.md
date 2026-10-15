# Midday: self-contained MR description and checklist review

## Objective

Practice writing an MR description a stranger could review from, then giving a peer review where every comment is actionable and tied to a checklist.

## Background

Your practice fix branch for #11 (from `01`) is the material; issues #7–#10 make good second-review material for the checklist. The repo's MR format is Summary / Changes / Testing / Risks plus a `Related to` footer (see MR !4 for a recent example). There is no `.gitlab/` template in this project — the convention lives in merged MRs.

## Part A — Description peer swap

1. Draft the MR description from your diff and issue #11: Summary starts from the user-visible symptom (wrong invoices matched), Changes lists files, Testing quotes the red assertion and the green run plus gate output, Risks names real side effects (e.g. previously-"working" regex searches now literal) or states none.
2. Ask Claude to draft it from the diff, then edit by hand — fix anything it overstated, cut filler, make the test evidence exact.
3. **Peer swap:** hand only the description (no diff, no code) to a partner or a fresh Claude session and ask: "could you re-implement this fix from the description alone?" Record the verdict and close every gap they find before proceeding.

## Part B — Checklist review

Review the practice branch (yours or a partner's) in this order — stop at the first failing step:

| Step | Question | What to look at |
| --- | --- | --- |
| 1. Correctness | Does it fix #11 and nothing else? | The `INV.001` trio: literal-only match after, over-match before; edge inputs `(`, `[`, `*` treated literally |
| 2. Tests | Would the test fail if the fix were reverted? | Revert-check: stash the fix, run the test, confirm red for the right reason |
| 3. Readability | Can the next person change it safely? | Escape logic matches the user-search precedent; no duplicated regex rules |
| 4. Security basics | Does it reduce (not add) injection surface? | Raw user input no longer reaches `$regex`; no secrets in errors/logs |
| 5. Scope | Is it one purpose? | Diff touches the search filter only; unrelated refactors split out |

Write at least three actionable comments, each with file:line, severity (must-fix / should-fix / nit), the problem in one sentence, and a concrete change. The most useful kind ties description to tests: "your description claims X, no test proves X."

## Deliverable

- MR description draft + peer-swap verdict with gaps closed.
- Review table: comment, severity, checklist step, outcome (addressed / follow-up / declined-with-reason).

## Reflection

- Which review comment could only have been written by running the code, not reading it?
- What did the peer swap reveal that the checklist alone missed?
