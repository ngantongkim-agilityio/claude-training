# Explore: explain a feature, verify two claims

## Objective

Practice the Day 01 skill at Desktop speed: get Claude to explain a real feature with file:line evidence, then independently verify at least two claims against source.

## Background

Suggested feature: invoice-number `search` in `GET /invoices` — `findAll` in `apps/tax-invoice-api/src/modules/invoices/invoice.repository.ts` builds `filter.invoiceNumber = { $regex: search, $options: 'i' }` with raw input, while `apps/tax-invoice-api/src/modules/users/user.repository.ts` escapes first. Contract: `docs/APIs_DESIGN.md` ("Search by invoice number (partial match)"). You may pick a different real feature (e.g. status transitions in `invoice.service.ts`, `getDateRangeUTC` in `src/utils/date.ts`), but it must be real code you can open.

## Steps

1. Prompt: "Explore this codebase and explain how feature X works." Require file:line evidence for each claim.
2. Pick two checkable claims (e.g. "search input reaches `$regex` unescaped" / "user email search escapes with this exact line").
3. Verify each by reading the cited lines yourself — and where cheap, by running (e.g. a mocked Jest check of the captured filter, per the Day 02 pattern). Record check + result per claim: confirmed / refuted / nuanced.
4. Note one thing the explanation missed or got subtly wrong, if any.

## Deliverable

The explanation (or its key claims), plus a two-row table: claim / check performed / result. At least one check must involve reading source yourself, not asking Claude again.

## Reflection

- Did requiring file:line evidence make verification faster? By how much?
- When is running a check worth it over just reading?
