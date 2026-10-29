# Plan: KAN-4 (T1) Record invoice audit events with actor and event type

**Jira:** [KAN-4](https://claude-training-dev.atlassian.net/browse/KAN-4) · **Status:** approved 2026-10-29 ·
**Written:** 2026-10-29

> Implementation plan only. KAN-4 in Jira is authoritative for requirements and acceptance criteria; if this plan and
> the ticket differ, the ticket applies.

## Context

Invoice history stores only `{ changes, createdAt }`, and only for field edits on submitted invoices
(`apps/tax-invoice-api/src/modules/invoices/invoice.service.ts:249-257`). It records no actor and no event type, so
finance can't tell auditors who did what. KAN-4 adds an append-only audit trail with event type, an actor email
snapshot and server time, and keeps existing (legacy) entries readable without rewriting them. KAN-5, KAN-6 and KAN-8
build on it.

## Precheck

- The ticket is ready: it has AC-1 to AC-8 and a test-case table, and no "is blocked by" links.
- `git status -sb` on `main` shows a clean tree, `## main...origin/main`.
- Local `main` and local `origin/main` are both `43142d5` (the PR #26 merge). No fetch was run, so whether GitHub has
  newer commits is unknown.

## Contract implications

`apps/tax-invoice-api/docs/APIs_DESIGN.md` is the source of truth. KAN-4 explicitly requires these additions (AC-4,
AC-6, AC-7, AC-8):

- History entries in `GET /invoices`, `GET /invoices/:id` and `GET /invoices/:id/history` gain `eventType` (an event
  type or `null`), `actor` (an email or `null`) and `legacy: true` (on legacy entries only, as in the spec example).
  `changes` is always present, `{}` when empty. Entries stay oldest first in stored order, with no sorting.
- New invoices start with one `created` entry instead of `[]` (AC-1).
- Because one shared mapper builds every entry, the list no longer returns `changes: undefined`, and detail history
  entries no longer carry the subdocument `_id`. That `_id` is undocumented (not in `InvoiceResponseSchema`), and
  neither the list nor the history endpoint returns it today. This is the only field that goes away.
- No request contract changes. Zod already drops a `histories` key from create and update bodies
  (`apps/tax-invoice-api/src/modules/invoices/invoice.dto.ts:9-23`).
- Unchanged: the v2 list (`apps/tax-invoice-api/src/modules/invoices/invoice-v2.service.ts:91-97`) returns raw stored
  entries and stays out of scope. New entries there will show the stored `eventType` and `actor`, but legacy entries
  are not normalized.

## Scope check

Each acceptance criterion maps to a plan step:

| AC   | What the plan does                                                                             | Step |
| ---- | ---------------------------------------------------------------------------------------------- | ---- |
| AC-1 | `beforeCreate` stores one `created` entry with `actor` and `createdAt: new Date()`             | 5    |
| AC-2 | `updateInvoiceInfo` tags its existing submitted-only entry `edited` with `actor`               | 5    |
| AC-3 | `softDelete` sets `isDeleted` and pushes `deleted` in one update; the reads already 404        | 5    |
| AC-4 | The read mapper adds `legacy: true`, `actor: null`, `edited` or `null`; reads make no writes   | 3, 6 |
| AC-5 | Entries are only pushed; no endpoint edits them; `histories` in a body is dropped              | 4, 5 |
| AC-6 | The existing endpoint and its 403/404 checks stay; tests cover 200 oldest first, 403, 404, 401 | 6, 7 |
| AC-7 | One mapper serves list, detail and history; `changes` defaults to `{}`                         | 3, 6 |
| AC-8 | `eventType` stays optional, so saving a doc with legacy entries passes; both docs are updated  | 2, 8 |

Legacy entries stay backward compatible:

- No migration and no write-back: legacy entries are normalized on every read and stored unchanged.
- `eventType` is optional in the Mongoose schema. A check against the installed Mongoose 8.24.5 found that a
  subdocument with `eventType` missing or `null` passes `validateSync()`, and an unknown value is rejected, so editing
  an invoice that holds legacy entries keeps working.
- The response keeps `changes` and `createdAt` as before, and every new field is an addition. `apps/web` doesn't read
  invoice `histories` (searched `apps/web/src`), so no client breaks.

KAN-5 and KAN-6 behavior stays out:

- The plan adds the `submitted`, `resubmitted`, `approved` and `rejected` values to the event-type enum, because
  KAN-4's business rules list them. No code records them; KAN-5 records the first, third and fourth, and KAN-6
  records `resubmitted`.
- No `reason` or `comment` field and no PATCH changes, which belong to KAN-5.
- Rejected invoices keep returning 409 on edit and delete, `edited` stays submitted-only, and there is no
  `expectedUpdatedAt`, all of which belong to KAN-6.

## Scope

In: the event-type enum; recording `created`, `edited` (while submitted) and `deleted`; legacy read normalization; one
shared mapper for list, detail and history; the Swagger history path; `APIs_DESIGN.md` and `DB_DESIGN.md`.

Out: recording `submitted`, `approved` and `rejected`, plus `reason` and `comment` (KAN-5); `resubmitted` and editing
or deleting rejected invoices (KAN-6); the v2 list; slimming `histories`; deleted-invoice history; backfill or
migration; reports; email; web.

## Steps

Paths are under `apps/tax-invoice-api/`. Each step's tests ship in the same change as its code.

1. **Branch.** `git checkout -b feat/invoice-audit-events main`, which carries this plan file onto the branch.
   verify: `git status -sb` shows `## feat/invoice-audit-events`.

2. **Types and model.**
   - `src/types/invoice.ts`: add the `InvoiceEventType` enum (`created`, `edited`, `submitted`, `resubmitted`,
     `approved`, `rejected`, `deleted`), and extend `InvoiceHistory` with `eventType?: InvoiceEventType | null` and
     `actor?: string`.
   - `src/models/invoice.ts:6-15`: add `eventType: { type: String, enum: Object.values(InvoiceEventType) }`, not
     required (T1-DQ1), and `actor: String`, a plain snapshot that is never a reference (T1-DQ4).
   - New `src/models/__tests__/invoice.test.ts`: `validateSync()` without a database passes for an invoice holding
     legacy entries (`eventType` missing and `null`) next to a new `edited` entry (AC-8, TC-57), and fails for an
     unknown `eventType`.

   verify: `pnpm --filter @repo/api exec jest src/models/__tests__/invoice.test.ts`

3. **Shared history mapper** in `src/utils/invoice.ts`, next to `trackInvoiceChanges`.
   - `toInvoiceHistoryResponse` returns `{ eventType, actor, changes, createdAt }`, with `createdAt` as an ISO
     string.
   - An entry with a missing or `null` `eventType` gets `legacy: true` and `actor: null`. Its `eventType` becomes
     `edited` when `changes` has at least one key, and `null` otherwise.
   - `changes` that is missing, `null` or empty becomes `{}`.
   - The mapper picks each field explicitly, so the subdocument `_id` is dropped. A comment cites the legacy rule
     (BR-13, T1-DQ1).
   - New `src/utils/__tests__/invoice.test.ts`:
     - TC-08: a legacy entry with changes, with `eventType` missing and with it `null`.
     - TC-58: `changes` missing, `null` and `{}`.
     - TC-59 and AC-7: `changes: {}` on events that aren't edits.
     - A new entry's `actor` passes through unchanged.

   verify: `pnpm --filter @repo/api exec jest src/utils/__tests__/invoice.test.ts`

4. **DTOs** in `src/modules/invoices/invoice.dto.ts`.
   - `InvoiceHistorySchema` (`:50-53`): add `eventType: z.enum(InvoiceEventType).nullable()`,
     `actor: z.string().nullable()` and `legacy: z.literal(true).optional()`. `changes` stays required.
   - `InvoiceEntity.histories` (`:111`): use `InvoiceHistory[]` from `@/types`.
   - `invoice.dto.test.ts`: `UpdateInvoiceSchema` and `CreateInvoiceSchema` drop a `histories` key (TC-10).

   verify: `pnpm --filter @repo/api typecheck`, then
   `pnpm --filter @repo/api exec jest src/modules/invoices/__tests__/invoice.dto.test.ts`

5. **Record events** in `src/modules/invoices/invoice.service.ts`.
   - `beforeCreate` (`:55-68`): set
     `histories: [{ eventType: CREATED, actor: data.user, createdAt: new Date() }]`. `data.user` is
     `req.currentUser.email` (`invoice.controller.ts:50`).
   - `updateInvoiceInfo` (`:249-257`): the pushed entry gets `eventType: EDITED` and `actor: userEmail`. The condition
     stays submitted-only, and KAN-6 extends it to rejected (spec IDR-4).
   - `deleteInvoice` (`:309`): call `this.invoiceRepository.softDelete(invoiceNumber, deletedEvent)`, and throw
     `NotFoundError` when it returns null. Repository `softDelete` (`invoice.repository.ts:160-169`) gains an
     optional event and runs `{ $set: { isDeleted: true }, $push: { histories: event } }` in its single
     `findOneAndUpdate` (AC-3).
   - Service tests in `invoice.service.test.ts`:
     - TC-01: a user creates an invoice.
     - TC-02: an admin creates one.
     - TC-03: one field changes on a submitted invoice.
     - TC-05: a draft edit records nothing.
     - TC-06: a no-op update records nothing.
     - TC-07: one `findOneAndUpdate` call carries `$set` and `$push`; then detail and history get null from
       `findOne` and return 404.
     - AC-5: earlier entries deep-equal after an edit and after a delete, with exactly one entry appended.
     - TC-57: editing a document that holds a legacy entry.
     - The existing forbidden and not-found cases are kept.

   verify: `pnpm --filter @repo/api exec jest src/modules/invoices/__tests__/invoice.service.test.ts`

6. **Use the mapper on every read.**
   - `getInvoiceByNumber` (`:124-128`) and `getInvoiceHistory` (`:348-353`) in the service, and `findAll` in
     `invoice.repository.ts:114-117`.
   - Tests:
     - TC-55: one fixture read through list, detail and history gives identical entries.
     - TC-08: the same read through all three makes no `save` or `findOneAndUpdate` call.
     - TC-11 and TC-12: the owner and an admin get 200, oldest first, with real actor emails.
     - TC-13: another user gets 403.
     - TC-56: the stored actor is returned as-is, with `UserModel` mocked and never called.

   verify: `pnpm --filter @repo/api exec jest src/modules/invoices`

7. **Routes and Swagger.**
   - `src/modules/invoices/invoice.swagger.ts`: register `GET /invoices/{invoiceNumber}/history` with
     `successResponse(GetInvoiceHistoryResponseSchema)` and 401, 403 and 404 responses (spec IDR-3). List and detail
     pick up the new fields through `InvoiceResponseSchema`. The 403 response uses a new `forbidden()` helper in
     `src/configs/swagger.ts`, next to `unauthorized()` and `notFound()`.
   - `src/routes/v1/__tests__/invoice.test.ts:202`: add TC-14, where the authenticate mock returns 401 and the
     controller isn't called, and update the history mock to the new entry shape.

   verify: `pnpm --filter @repo/api exec jest src/routes/v1/__tests__/invoice.test.ts`

8. **Docs.**
   - `docs/APIs_DESIGN.md:84,114-118`: the PUT row says edits are recorded while an invoice is submitted. The history
     section gives the entry fields, the event types, the legacy shape, oldest-first order and the 401, 403 and 404
     cases, and notes that list and detail embed the same entries.
   - `docs/DB_DESIGN.md:29-33`: `InvoiceHistory` becomes `eventType`, `actor`, `changes` and `createdAt`. This drops
     the `description` field the model never had, and the section notes that legacy entries are normalized on read
     and never rewritten.

   verify: `pnpm --filter @repo/api exec prettier --check docs`, plus a manual read for TC-15.

## Test strategy

This is feature work, so each step writes its failing tests first, taken from the ticket's ACs and the spec's test
cases. All tests are unit-level with `InvoiceModel` mocked and no MongoDB, per `apps/tax-invoice-api/CLAUDE.md`.

- TC-09 (create through approve, 7 events) can't run until KAN-5 and KAN-6 record status events. KAN-4 covers its
  append-only part with a create, edit, delete sequence.
- TC-15 is a manual review of the docs.

## Validation

- verify: `pnpm --filter @repo/api check`
- verify: `pnpm check` from the repository root
- verify: `git diff --stat main` lists only the files named in this plan.

After that comes a self-review and one independent `code-reviewer` pass. Work stops before committing, as
`implement-ticket` requires.
