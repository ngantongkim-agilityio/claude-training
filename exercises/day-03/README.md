# Day 03: Fix, Review, Merge (Checkpoint 1)

Close the loop opened on Day 02: fix issue #11 on a branch with a regression test, write an MR description a stranger could review from, give a checklist-driven peer review, and merge after resolving a conflict the right way.

- **Area:** Backend, Express + TypeScript (Mongoose, MongoDB, Zod v4, Jest)
- **Project:** `apps/tax-invoice-api/` in this repository
- **Language:** English
- **Tool:** Claude Code in this repo (branch `feat/exercise-day-3` for these notes; the fix itself goes on a separate `fix/` branch per the exercises)
- **Issues:** [#11](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/11) is the fix target; [#7](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/7)–[#10](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/10) are review-material context
- **Method:** morning — red-green fix of #11 with a mocked regression test; midday — MR description peer-swap and checklist review; close — merge-vs-rebase conflict decision and Checkpoint 1 self-assessment.

## Scenario

Day 02 ended with a prediction (unescaped `$regex` over-matches) and a mock-level verification sketch, but no fix and no runtime proof pasted into #11. Day 03 finishes the job: the failing test becomes a committed regression test, the one-line escape (mirroring `user.repository.ts`) lands behind it, the MR description carries the full story, and a seeded conflict forces the merge-vs-rebase decision Day 02 only hinted at.

## Contents

| File | Part |
| --- | --- |
| [01-fix-search-regex.md](01-fix-search-regex.md) | Morning: red-green fix of #11 with regression test |
| [02-review-with-checklist.md](02-review-with-checklist.md) | Midday: self-contained MR description, peer swap, checklist review |
| [03-merge-after-conflict.md](03-merge-after-conflict.md) | Close: seeded conflict, merge (not rebase), Checkpoint 1 |

## Key project facts (used across tasks)

- Defect: `apps/tax-invoice-api/src/modules/invoices/invoice.repository.ts` (`findAll`) builds `filter.invoiceNumber = { $regex: search, $options: 'i' }` with raw input; precedent `apps/tax-invoice-api/src/modules/users/user.repository.ts` escapes first with `email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.
- Contract: `docs/APIs_DESIGN.md` — "Search by invoice number (partial match)".
- Test conventions: Jest, `jest.mock('@/models', ...)` + assert on mocked `InvoiceModel.find` args, no live DB in unit tests, tests colocated in `__tests__/` (see `apps/tax-invoice-api/CLAUDE.md`).
- Quality gate: `pnpm --filter @repo/api test <target>`, `typecheck`, `lint`; pnpm exclusively.
- Branch/MR conventions: `fix/<issue>-<short-kebab>` branches, small focused commits (test + fix separate), MR with Summary / Changes / Testing / Risks + `Related to #11`, squash merge, delete branch after merge.

## Checkpoint 1

| Requirement | Evidence (you produce today) |
| --- | --- |
| Reproduce #11 and record proof | Day 02 scratch verification, pasted into #11 with mock-vs-live label |
| Fix on a branch with a test | `fix/11-...` branch: failing-test commit then fix commit |
| MR with a self-contained description | Peer-swap verdict recorded in `02` notes |
| One peer review with 3+ actionable comments | Review table in `02` notes, each tied to a checklist step |
| One merge with conflict resolved | `03` notes: resolution rationale + test output after resolving |

## Deliverables

- `01` — red/green test output, the fix diff, full gate results.
- `02` — MR description draft, peer-swap verdict + gaps closed, checklist review with 3+ actionable comments.
- `03` — conflict resolution notes (why merge, not rebase; why the chosen resolution), merge + cleanup confirmation, Checkpoint 1 self-assessment.
- These exercise notes live on `feat/exercise-day-3`; the practice fix itself stays on its own disposable `fix/` branch (or as a sketch — see `01`).
