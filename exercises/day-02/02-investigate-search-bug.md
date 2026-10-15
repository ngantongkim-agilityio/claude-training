# Afternoon: investigate issue #11 and express it as a failing test

## Objective

Practice the full bug-investigation loop on a real suspected defect: trace it through source, state a prediction, verify by running (not by trusting), and write the bug as a failing test — while keeping predicted behavior and verified behavior clearly separated.

## Background

[Issue #11](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/11) reports that invoice search interpolates user input unescaped into a MongoDB `$regex`. The issue already contains the code evidence; your job is to redo the loop yourself and produce the runtime proof the issue asks for.

The two files that matter:

- Suspect: `apps/tax-invoice-api/src/modules/invoices/invoice.repository.ts` — `findAll` builds `filter.invoiceNumber = { $regex: search, $options: 'i' }` with the raw input.
- Precedent: `apps/tax-invoice-api/src/modules/users/user.repository.ts` — escapes with `email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` before building its `$regex`.

The design contract (`apps/tax-invoice-api/docs/APIs_DESIGN.md`): "Search by invoice number (partial match)" — i.e. case-insensitive literal substring, consistent with user email search.

The issue's predicted behavior (not yet runtime-verified): with invoices `INV-001`, `INVX001`, `INV.001` seeded, `GET /invoices?search=INV.001` matches all three because `.` acts as a regex wildcard; literal matching would return only `INV.001`.

## Steps

1. **Trace (read-only):** open `findAll` in the invoice repository and the user repository's email filter. Confirm with your own eyes which input is escaped and which is not. Note the exact lines.
2. **Predict (in writing, before running):** state what `search=INV.001` should return under each semantics — regex (all three) vs literal (only `INV.001`). Write this down before you run anything.
3. **Ask Claude for hypotheses:** paste the trace and your prediction into a fresh session with "give ranked hypotheses for the observed over-match, each with one command that confirms or rejects it". Do not let it skip to a fix.
4. **Verify by running, at the cheapest level:** write a scratch Jest test file inside a `__tests__/` folder (Jest only picks up `**/__tests__/**/*.test.ts` — e.g. a temp `investigate-scratch.test.ts` next to the existing invoice tests, deleted afterward; never commit it) following the existing `jest.mock('@/models', ...)` pattern from `src/modules/invoices/__tests__/invoice.service.test.ts`. Drive the repository's `findAll` (via `InvoiceRepository` directly or through the service) with `search: 'INV.001'` and assert on the filter passed to the mocked `InvoiceModel.find`. Run it with `pnpm --filter @repo/api test <target>`. A live MongoDB run is optional and not required.
5. **Label your evidence honestly:** write down whether your result is a mock-level verification (filter contents asserted) or a live-DB verification (rows returned). Per the issue and `CLAUDE.md` (no live DB in unit tests), mock-level is the expected outcome here. Never write "reproduced against MongoDB" unless you actually did.
6. **Sketch the failing test for the fix:** the test that fails now (unescaped `$regex` in the captured filter) and passes after escaping (mirroring the user-search precedent). Keep the sketch in your notes — implementing the fix is Day 03 work, not today.

## Deliverable

- The traced lines in both repository files.
- Your written prediction (step 2) with a timestamp showing it came before the run.
- The verification result, labeled mock-level or live-DB, including the actual captured filter or rows.
- The failing-test sketch: input, assertion, and why it fails now / passes after the fix.
- One paragraph: what Claude's hypotheses got right, what you rejected by running, and what remains for Day 03.

## Review criteria

- Prediction is written before verification (order matters — it proves the test tests the bug).
- Evidence label is honest: mock filter assertion vs live rows, never conflated.
- No `src/` production files modified (a temp scratch test under `__tests__/`, deleted afterward, is the only exception); no fix implemented (that is Day 03).
- No claim of runtime reproduction beyond what was actually executed.

## Reflection

- What was the cheapest check that could confirm or kill this bug, and did you run it first?
- Where did Claude try to jump to the fix, and what did you lose or gain by holding it to hypotheses?
- How does the user-search precedent change the fix from "design a solution" to "follow the existing pattern"?
