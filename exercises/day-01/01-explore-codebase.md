# Task 1: Explore the codebase with Claude

## Objective

Practice using Claude Code to navigate an unfamiliar backend: find where things live, trace a request end to end, and verify the answer against the real files.

## Background

The Tax Invoice API follows a strict layering (see `apps/tax-invoice-api/CLAUDE.md`):

```text
Request → Authentication middleware → Controller → Service → Mongoose Model → MongoDB
```

Key entry points to discover:

- `apps/tax-invoice-api/src/app.ts` — app wiring
- `apps/tax-invoice-api/src/routes/v1/` — route registration
- `apps/tax-invoice-api/src/modules/invoices/` — controller, service, repository, DTO
- `apps/tax-invoice-api/docs/APIs_DESIGN.md` — the API contract source of truth

## Steps

1. Ask Claude (vague first): `how does this API work?`
2. Read the answer, then check it against `src/app.ts` and `src/routes/v1/`. Note anything vague, missing, or wrong.
3. Ask again with a refined prompt, e.g. naming the files, the layer rule, and the exact question: trace `PATCH /invoices/:invoiceNumber` (status update, see `src/routes/v1/invoice.ts`) from route to database, naming each file and what each layer does.
4. Verify every file named in the answer exists and does what Claude claims (open `invoice.controller.ts`, `invoice.service.ts`, `invoice.repository.ts`).

## Deliverable

Paste both prompts and a short verdict: which files Claude identified correctly, what the refined prompt fixed, and one thing you had to verify by reading code yourself.

## Reflection

- What context (file paths, layer rules, endpoint name) made the biggest difference?
- When should you ask Claude to "show the evidence" (file:line) instead of trusting a summary?
