# Day 02: Read Issues, Ask Questions, Reproduce

Learn to work a real backlog the way a developer does: read each issue for what it actually says, ask what is missing before coding, trace a suspected bug through source, and prove it with a test — never claiming more than you ran.

- **Area:** Backend, Express + TypeScript (Mongoose, MongoDB, Zod v4, Jest)
- **Project:** `apps/tax-invoice-api/` in this repository
- **Language:** English
- **Tool:** Claude Code in this repo (branch `feat/exercise-day-2`)
- **Issues:** [#7](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/7) · [#8](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/8) · [#9](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/9) · [#10](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/10) · [#11](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/11)
- **Method:** morning — analyze all five issues on paper first, then refine with Claude; afternoon — investigate #11 hands-on and express it as a failing test; close — a short Git practice block.

## Scenario

The five issues are real backlog items written against this API, with deliberately varying clarity: #7 is well-specified, #8 and #9 have open design questions for the reporter, #10 is intentionally vague, and #11 is a bug whose description separates code-inspection predictions from runtime verification. Your job is to meet each issue where it is — not to invent what it does not say.

## Contents

| File | Part |
| --- | --- |
| [01-analyze-backlog-issues.md](01-analyze-backlog-issues.md) | Morning: facts vs unknowns for #7–#11, clarifying questions, reporter role-play |
| [02-investigate-search-bug.md](02-investigate-search-bug.md) | Afternoon: trace #11 through source, predict, verify, write the failing test |
| [03-rebase-conflict-workflow.md](03-rebase-conflict-workflow.md) | Git block: log/diff reading, `pull --rebase`, seeded conflict |

## Key project facts (used across tasks)

- Stack: Express 5, TypeScript, Mongoose + MongoDB, Zod v4 for DTO validation, Jest with mocked models (never a live DB in unit tests — see `apps/tax-invoice-api/CLAUDE.md`).
- Test pattern: `jest.mock('@/models', ...)` then assert on the mocked `InvoiceModel.find` / `create` calls — see `src/modules/invoices/__tests__/invoice.service.test.ts`.
- Search filter under investigation: `filter.invoiceNumber = { $regex: search, $options: 'i' }` (`src/modules/invoices/invoice.repository.ts`, `findAll`); correct precedent in `src/modules/users/user.repository.ts` (input escaped before `$regex`).
- Design contract: `docs/APIs_DESIGN.md` ("Search by invoice number (partial match)").
- Quality gate: `pnpm --filter @repo/api test <target>`, `typecheck`, `lint`.
- Package manager is pnpm exclusively.

## Deliverables

- `01-analyze-backlog-issues` — a facts/unknowns/assumptions table for each of #7–#11, clarifying questions for #8–#10, and notes from a reporter role-play.
- `02-investigate-search-bug` — a trace of #11 through source with a stated prediction, a verification result clearly labeled as mock-run or live-run, and a failing-test sketch (test code may live in your notes, not in `src/`).
- `03-rebase-conflict-workflow` — Git practice notes: what `log --graph` and the three-dot `diff` showed, how the conflict was resolved.
- No application code changed, no issue descriptions edited (`git status` shows only `exercises/day-02/`).
