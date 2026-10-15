# Loop: ticket to MR, guided then solo

## Objective

Run the complete daily loop in Desktop — paste ticket, plan, approve, implement, steer on the diff, test, draft MR — once with guidance, then prove independence by repeating it alone on a second ticket.

## Part A — Guided loop (suggested: issue #11)

Use [issue #11](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/11) (invoice search regex escape). It is ideal for a guided run: small scope, an exact precedent to mirror (`user.repository.ts` escape line), and Day 02–03 notes to lean on.

| Step | What to do |
| --- | --- |
| 1. Paste the ticket | New Desktop session, one topic: paste #11's description |
| 2. Plan mode | Claude reads `invoice.repository.ts`, `user.repository.ts`, and the existing invoice tests, then writes a plan without changing files |
| 3. Review and approve | Check the plan mirrors the precedent (escape, not a new helper); approve or reject with reasons |
| 4. Implement | Test first (red), then fix (green), on `fix/11-...` — small focused commits |
| 5. Steer on the diff | Open the diff pane; leave at least one hunk-level comment steering a change (naming, comment, scope) and confirm Claude addresses it |
| 6. Run the tests | `pnpm --filter @repo/api test <target>`, `typecheck`, `lint:check` — record real output |
| 7. Prepare MR | Commit and MR drafts shown and approved before any `commit`/`push`/create; description in Summary / Changes / Testing / Risks + `Related to #11` |

## Part B — Solo loop (suggested: issue #7 or #9)

Repeat the full loop independently on a second ticket — no guidance, no peeking at Part A notes until stuck:

- Issue [#7](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/7) (report date validation, well-specified) or [#9](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/9) (single-sided date filters, needs the helper-choice decision first).
- Same seven steps, same evidence standard. If you consulted Part A or asked for help, mark exactly where — a solo run with one flagged assist is worth more than a claimed-solo run.

## Deliverable

- Part A: plan approval notes, hunk comment + outcome, test output, MR draft (or MR URL if opened).
- Part B: same evidence set, plus an honesty line (fully solo / assisted at step N).
- Practice code stays on disposable `fix/` branches; only these notes go under `exercises/day-04/`.

## Reflection

- Which step would you skip under deadline pressure, and what would that cost?
- What did Plan mode decide that implementation could not have discovered cheaper?
