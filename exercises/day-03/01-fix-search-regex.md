# Morning: red-green fix of issue #11

## Objective

Practice the smallest safe fix loop: write the failing regression test first, watch it fail for the right reason, apply the minimal fix following the existing precedent, and run the full quality gate.

## Background

[Issue #11](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/11): invoice `search` passes raw input into `$regex`, so `search=INV.001` matches `INV-001` and `INVX001` as well as the literal `INV.001`. The user-search precedent escapes with `email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` before building its `$regex`. The intended behavior per `docs/APIs_DESIGN.md` is case-insensitive literal substring ("Search by invoice number (partial match)").

Work on a disposable practice branch (e.g. `fix/11-escape-invoice-search`) cut from `main` — not on `feat/exercise-day-3`, which holds only these notes. These exercises describe the loop; whether you push the practice branch is up to you and your reviewer.

## Steps

1. **Red:** add a regression test next to the existing invoice tests (`src/modules/invoices/__tests__/`, following the `jest.mock('@/models', ...)` pattern in `invoice.service.test.ts`) that drives `findAll` with `search: 'INV.001'` and asserts the filter passed to `InvoiceModel.find` uses an escaped literal. Run `pnpm --filter @repo/api test <target>` and confirm it fails showing the unescaped `$regex`. Commit the test alone (`test: ...`).
2. **Ask Claude for the fix, then constrain it:** ask for the minimal change; require it to mirror the `user.repository.ts` escape line rather than invent a new helper. Reject any proposal that touches other filters, adds dependencies, or refactors the repository.
3. **Green:** apply the one-line escape in `invoice.repository.ts` (`findAll`), re-run the target test, and confirm it passes. Commit the fix alone (`fix: ...`).
4. **Gate:** run the full API check — `pnpm --filter @repo/api test <target>`, `typecheck`, `lint` — and record real output, including any pre-existing failures you did not cause. Paste the mock-level proof (captured filter before/after) into issue #11 with an honest label, as Day 02 required.
5. **Small-commits check:** `git log --oneline` on your practice branch should show test-then-fix (two commits, one purpose each), consistent with the repo's small-focused-commits convention.

## Deliverable

- Red output (failing assertion showing the raw `$regex`) and green output (passing after the escape).
- The fix diff (expected: ~2 lines in `invoice.repository.ts`).
- Full gate results, with pre-existing failures (if any) clearly marked as not yours.

## Review criteria

- Test fails before and passes after, for the asserted reason (escaped literal in the captured filter).
- Fix mirrors the existing precedent; no new helpers, deps, or unrelated changes.
- Commits are test-then-fix, separately reviewable.

## Reflection

- Where did Claude propose more than the minimal fix, and what sentence in your prompt held it to the precedent?
- What would a reviewer need to see to trust this MR without re-running anything?
