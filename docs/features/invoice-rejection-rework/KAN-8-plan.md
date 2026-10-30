# Plan: KAN-8 (T5) Show the invoice history timeline on the web detail page

**Jira:** [KAN-8](https://claude-training-dev.atlassian.net/browse/KAN-8) · **Status:** approved 2026-10-30 ·
**Written:** 2026-10-30

> Implementation plan only. KAN-8 in Jira is authoritative for requirements and acceptance criteria; if this plan and
> the ticket differ, the ticket applies.

## Context

The web invoice detail page shows the invoice's fields but not its audit trail, so an owner or admin can't see who
created, edited, submitted, approved or rejected it, or why. KAN-8 adds a History section, newest first, built from the
`histories` the detail response already returns. It builds on KAN-4 (Done) and runs in parallel with KAN-5, KAN-6 and
KAN-7 (Jira comment 10000).

## Contract (no API change)

- The timeline reads `histories` from `GET /invoices/:id` only; it never calls `GET /invoices/:id/history`.
- Entries keep the API shape `{ eventType, actor, changes, createdAt?, legacy? }`, oldest first. `reason` and
  `comment` are optional on the web type and shown only when present; the API returns them once KAN-5 merges.
- The web types add `InvoiceEventType`, `InvoiceFieldChange` and `InvoiceHistoryEntry`, and `histories?` on
  `Invoice`. Nothing in `apps/tax-invoice-api` changes.

## Review decisions

| #   | Decision                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------- |
| R1  | Reverse a copy for display; the API order and the cached `histories` stay oldest first and are never mutated        |
| R2  | `reason` and `comment` are optional and tested on mocked responses (comment 10000, point 1)                         |
| R3  | The refresh-after-action test proves UI behaviour on a mocked refetch, not that the API records the event (point 2) |
| R4  | The T4 banner doesn't exist yet, so the timeline sits below the card or edit form and adds no banner (point 3)      |
| R5  | Add Jest, `next/jest`, jsdom and React Testing Library, including the `@testing-library/dom` peer (point 4)         |
| R6  | `jest` joins the web `check` script in the feature change, so `check` never runs with no tests                      |
| R7  | Single test files run with `pnpm --filter @repo/web exec jest <pattern>`                                            |
| R8  | Amounts stored as numeric strings format as amounts, since the API types change values as `string \| number`        |
| R9  | List rows use a key derived from the entry's position in the API order, so rows keep identity when one is added     |
| R10 | `pnpm-lock.yaml` ships with the change, since CI installs with a frozen lockfile                                    |

## Scope

In: Jest and React Testing Library setup for `apps/web`, the history entry types, a shared `formatAmount` helper, the
history helpers, the `InvoiceHistory` component, rendering it on the detail page, the web `check` script and a
`CONTRIBUTING.md` line for the web gate.

Out: any API change, the `/history` endpoint, paging or filtering entries, the T4 banner and actions (KAN-7), a
resubmit action (KAN-6), deleted invoices, reports, and the TC-54 release check.

## Steps

Paths are under `apps/web/`. Each step's tests are written first and ship with its code.

1. **Test setup**: add `jest`, `jest-environment-jsdom`, `@types/jest` and `@testing-library/{dom,react,jest-dom,user-event}`
   as dev dependencies; `jest.config.mjs` through `next/jest` (SWC, `@/` alias, jsdom, `__tests__` match) and
   `jest.setup.ts` loading jest-dom; a `test` script.
2. **Types** (`src/features/invoices/types.ts`, `index.ts`): the history entry types with optional `reason` and
   `comment`, and `histories?` on `Invoice` (comment 10000, point 5).
3. **Formatting** (`src/utils/format.ts`): `formatAmount` gives the detail page's `$` format, or "—" when missing; the
   page's Amount and Tax rows reuse it with unchanged output.
4. **History helpers** (`src/features/invoices/history.ts`): `toNewestFirst` (R1); `getEventLabel` with the six labels
   and the two approved legacy texts; `formatChange` as "Field: old → new" with amount formatting (R8) and "—" for a
   missing value.
5. **Component** (`src/features/invoices/components/invoice-history.tsx`): a History section with a labelled ordered
   list of every entry (label, local time, actor, reason, comment, change rows), or "No history recorded yet."
6. **Page** (`src/app/(dashboard)/invoices/[invoiceNumber]/page.tsx`): render `InvoiceHistory` in the success branch,
   so it follows the page's loading and error states. Refresh relies on the existing `invalidateQueries` after each
   mutation.
7. **Gate and docs**: `jest` added to the web `check` script (R6); `CONTRIBUTING.md` lists
   `pnpm --filter @repo/web check`.

## Tests

React Testing Library with the API client, current user and navigation mocked, per `apps/web/CLAUDE.md`.

- **Unit:** `formatAmount`; `toNewestFirst` leaves its input unchanged; every label and both legacy texts; change
  rows, missing values, numeric-string amounts and an unknown field.
- **Component:** newest first with label, actor and local time, input left oldest first (AC-1; TC-47); reason, and a
  comment only when present (AC-2; TC-48); change rows (AC-3; TC-49); legacy texts and the empty state (AC-4; TC-50,
  TC-51); 30 entries with no paging (AC-6; TC-70).
- **Page:** no History while loading or after a failure, and only `/invoices/INV-1` requested (AC-5; TC-52); an admin
  sees the same entries with real emails, and the cached `histories` stay oldest first (AC-6, AC-1; TC-53, TC-47);
  after Submit through the real dialog, the mocked refetch's new entry appears on top of the same list with no reload
  (AC-7; TC-71, R3).

## Validation

- verify: `pnpm --filter @repo/web exec jest --showConfig > /dev/null`
- verify: `pnpm --filter @repo/web check`
- verify: `pnpm check` from the repository root
- verify: `git diff --stat main` lists only the files named in this plan, plus `pnpm-lock.yaml`

Then a self-review and one independent `code-reviewer` pass. Work stops before committing, as `implement-ticket`
requires.

## Open risks

- R3: TC-71 runs on mocks; once KAN-5 merges, check in the running app that new events, `reason` and `comment` arrive.
- KAN-7 merge order: whichever of KAN-7 and KAN-8 lands second rebases `types.ts` and `page.tsx`.
- KAN-5 must return `reason` and `comment` on detail history entries, as Jira comment 10001 records.
- TC-54 is the release check, run once T1–T5 are all merged.
