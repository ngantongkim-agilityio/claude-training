# Task 3: Explain a project concept to a teammate

## Objective

Practice getting a focused, audience-appropriate technical explanation instead of a generic tutorial.

## Background

Pick one concept from the real codebase:

- **Option A — Invoice status workflow:** `updateInvoiceStatus` in `apps/tax-invoice-api/src/modules/invoices/invoice.service.ts` (lines ~135–208). A `USER` may move `draft → submitted`; an `ADMIN` may move `submitted → approved/rejected`; anything else throws `ForbiddenError`. Finalized invoices (`approved`/`rejected`) throw `ConflictError`.
- **Option B — Zod-first validation:** DTO schemas in `apps/tax-invoice-api/src/modules/invoices/invoice.dto.ts` define a Zod schema plus a `z.infer` type; per `CLAUDE.md`, validation belongs in the DTO/controller layer and services must not duplicate it.

Your reader: a new backend teammate who knows TypeScript but hasn't read this repo.

## Steps

1. Prompt A (vague): `explain invoice status validation in this project` (or the Zod option equivalent).
2. Assess: is it scoped to this repo's actual rules, or a generic Mongoose/Zod tutorial? Does it cite files?
3. Prompt B (refined): name the reader, the exact file and function, one required code snippet, and one required closing ("one common mistake and how to avoid it"). Keep it under 200 words.
4. Verify every claim in the answer against the source file before accepting it.

## Deliverable

Both prompts, the refined explanation (verified), and a note on any claim you had to correct after reading the code.

## Reflection

- Which constraint (audience, file scope, length, code snippet, closing mistake) cut the most generic filler?
- How do you verify an explanation without re-reading the entire file?
