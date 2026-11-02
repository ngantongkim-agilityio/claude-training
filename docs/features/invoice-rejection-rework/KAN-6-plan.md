# Plan: KAN-6 (T3) Let owners fix, resubmit or delete rejected invoices

**Jira:** [KAN-6](https://claude-training-dev.atlassian.net/browse/KAN-6) · **Status:** approved 2026-11-02 ·
**Written:** 2026-11-02
**Risk tier:** `standard` (no Auth or Data path from `REVIEW.md`; `models/**` stays untouched) · **Delivery:** own PR,
merge held until the KAN-7 PR is reviewed, then merged back to back.

> Implementation plan only. KAN-6 in Jira is authoritative for requirements and acceptance criteria; if this plan and
> the ticket differ, the ticket applies. The supporting spec (T3-AC1–AC16, TC-04, TC-27–37, TC-62–66) guides tests only.

## Context

Today a rejected invoice is final: PATCH, PUT and DELETE all refuse it. Owners therefore create new invoices. KAN-6 lets the owner edit, resubmit (same number, `resubmitted` event) or soft-delete a rejected invoice. It also stops an admin approving or rejecting a version they never saw (BR-15) by requiring `expectedUpdatedAt`.

## Precheck (observed)

- `git status -sb`: `## claude/analyze-kan-6-1c4b9d`, clean.
- HEAD = local `main` = `origin/main` (as last fetched) = `e0a1526`, PR #36. Not fetched in this session, so whether `main` is current is unverified. Branch `feat/rework-rejected-invoices` from `main` in `implement-ticket`.

## Contract (breaking change approved in the ticket, T3-DQ3)

- `PATCH /invoices/:id` (v1 and v2, since `InvoiceV2Controller`/`InvoiceV2Service` inherit it) gains `expectedUpdatedAt` (ISO date-time). It is required for `approved`/`rejected` and refused for any other status.
- New 409 `INVOICE_CHANGED`: "This invoice has changed since you opened it. Reload it to review the latest version."
- From `rejected`: owner `submitted` → 200 with a `resubmitted` event. `approved`/`rejected`/`draft` → 403 `INVALID_STATUS` (was 409 `CANNOT_UPDATE`, T3-DQ1).
- PUT and DELETE now accept rejected invoices for the owner. Approved invoices still get 409.
- A lost write race on PATCH, PUT or DELETE now gets 409 `INVOICE_CHANGED`. Today a lost PATCH race gets `CANNOT_UPDATE` (KAN-5 R1) and a lost DELETE race gets 404, as the test at `invoice.service.test.ts:648` checks; that test is updated.
- The response shapes don't change.

## Decisions

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Race guard on `__v`, entirely in the repository, with no schema change. Every invoice write is one guarded `findOneAndUpdate` (the KAN-5 R1 pattern) that filters on the `__v` the service read and does `$inc: { __v: 1 }`. A stale writer matches nothing. PUT drops `invoice.save()` for a new `updateInfo` method. The generic `update` (`invoice.repository.ts:142`) is left alone because `BaseRepository` defines it. |
| D2  | A `null` from any guarded write maps to `ConflictError(INVOICE_CHANGED)`. TC-66 ("Mongoose `VersionError`" in the spec) is tested as a `null` from the guarded write for both the edit and the approval. That is the same outcome through this repo's mechanism, so the spec's `optimisticConcurrency` is not used.                                                                                                          |
| D3  | The stale check compares `new Date(expectedUpdatedAt).getTime()` with the stored `updatedAt.getTime()`, at step 4 of the ticket's order (before the approved/transition checks), so AC-9 gets `INVOICE_CHANGED` rather than 403.                                                                                                                                                                                             |
| D4  | DELETE gets the version guard only (it bumps `__v`), so an edit racing a delete fails. DELETE takes no `expectedUpdatedAt`.                                                                                                                                                                                                                                                                                                  |
| D5  | The `submitted` event becomes `resubmitted` when the stored status is `rejected` (T3-DQ2). Resubmit takes no `expectedUpdatedAt`.                                                                                                                                                                                                                                                                                            |

## Steps

Paths are under `apps/tax-invoice-api/src/`. In each step the tests are written first, seen failing, and ship with the code.

1. **Messages** (`constants/errors.ts`): add `INVOICE_CHANGED`. Reuse `IS_REQUIRED`, `IS_INVALID` and `ONLY_ALLOWED_WHEN_STATUS('Expected updated at', 'approved or rejected')`.
   verify: `pnpm --filter @repo/api typecheck`
2. **DTO** (`modules/invoices/invoice.dto.ts:89-111`): add optional `expectedUpdatedAt` (`z.iso.datetime`, with the invalid message) and extend `checkStatusNote` (`:35`) with the required/only-allowed rules, keeping one message per field.
   verify: `pnpm --filter @repo/api test invoice.dto`
3. **Controller** (`invoice.controller.ts:102-127`): pass `expectedUpdatedAt` through. The body is still parsed before any service check (400 first).
   verify: `pnpm --filter @repo/api test invoice.controller`
4. **Repository** (`invoice.repository.ts:164-201`): `updateStatus` and `softDelete` take the read `__v`, add it to the filter, and add `$inc: { __v: 1 }`. Add `updateInfo(invoiceNumber, version, changes, event?)`: filter `{ invoiceNumber, isDeleted: { $ne: true }, __v: version }`, then `$set` the changed fields, `$push` the event when there is one, and `$inc` `__v`. It returns `null` when nothing matches.
   verify: `pnpm --filter @repo/api typecheck`
5. **Service: PATCH** (`invoice.service.ts:156-253`): reorder to 404 → 403 `FORBIDDEN` → non-admin asking `approved`/`rejected` → 403 `INVALID_STATUS` → stale `expectedUpdatedAt` → 409 `INVOICE_CHANGED` → approved → 409 `CANNOT_UPDATE` → allowed transitions (user draft→submitted, user owner rejected→submitted, admin submitted→approved/rejected), else 403. Pick the event per D5. Guarded `null` → `INVOICE_CHANGED`.
   verify: `pnpm --filter @repo/api test invoice.service`
6. **Service: PUT and DELETE** (`:282-309`, `:348-357`): allow `rejected`, and record `edited` for rejected as for submitted (it stays rejected). Replace `Object.assign` + `invoice.save()` with `updateInfo`, passing the read `__v` and the `changes` from `trackInvoiceChanges`. Skip the write when nothing changed, as today, where no event is recorded. A guarded `null` on PUT or DELETE → `INVOICE_CHANGED`. Approved still gets 409. The existing PUT tests that mock `invoice.save()` (`invoice.service.test.ts:459-587`) move to mocking `updateInfo`.
   verify: `pnpm --filter @repo/api test invoice.service`
7. **Swagger and docs**: in `invoice.swagger.ts`, the PATCH body and the 409 `INVOICE_CHANGED`. In `docs/APIs_DESIGN.md`, update `:84-86`, add the `expectedUpdatedAt` row and transition/error order to the PATCH table (`:112-127`), and change `:151-153` so `resubmitted` is no longer reserved. Sync `docs/tickets/KAN-6-…` and save this plan as `docs/features/invoice-rejection-rework/KAN-6-plan.md`.
   verify: `pnpm --filter @repo/api dev`, then open the Swagger UI and check that the PATCH body lists `expectedUpdatedAt`

## Tests: TC to file and level

All unit tests with models mocked (`apps/tax-invoice-api/CLAUDE.md`). Service tests are in `modules/invoices/__tests__/invoice.service.test.ts`, DTO tests in `invoice.dto.test.ts`, and controller tests in `invoice.controller.test.ts`. Service tests also assert that each repository write is called with the `__v` that was read.

| TC                  | AC          | File · level                                                                                     | Fails first?                   |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------------ | ------------------------------ |
| TC-04, TC-27        | AC-1        | service · unit                                                                                   | yes (rejected → 409 today)     |
| TC-28, TC-29, TC-31 | AC-2        | service · unit (3 cycles, 6 events)                                                              | yes                            |
| TC-30               | AC-2/rules  | service · unit (other admin approves, same admin rejects again)                                  | yes                            |
| TC-32               | AC-3        | service · unit                                                                                   | yes                            |
| TC-33               | AC-4        | service · unit (403, no write) and controller (PUT/DELETE role guard)                            | partly (resubmit by non-owner) |
| TC-34               | AC-4        | service · unit (approved: PUT/DELETE/PATCH 409)                                                  | no (regression)                |
| TC-35               | AC-8 legacy | service · unit (no `eventType` histories, no rejected event invented)                            | yes                            |
| TC-36               | AC-5        | service · unit                                                                                   | yes (409 → 403)                |
| TC-37               | rules       | DTO · unit (`amount: -5` → 400)                                                                  | no (regression)                |
| TC-62, TC-63        | AC-7        | service · unit                                                                                   | yes                            |
| TC-64               | AC-6        | DTO · unit (missing, `"yesterday"`, with `submitted`) and controller (400 before service)        | yes                            |
| TC-65               | AC-9        | service · unit                                                                                   | yes                            |
| TC-66               | AC-8        | service · unit (guarded write returns `null` on edit, approve and delete → 409, no second write) | yes                            |

TC-31 and TC-35 are listed as "API" or "seeded" in the spec. Here they are unit tests with mocked data, because the repo has no API-level test harness.

## Validation

- verify: `pnpm --filter @repo/api check`
- verify: `pnpm check` from the repository root
- verify: `git diff --stat main` lists only the files named above

Then a self-review, `/code-review`, and one independent `code-reviewer` pass. Work stops before committing (`implement-ticket`). The tier is `standard`, so `ship-ticket` skips the `/code-review ultra` gate.

## Out of scope

The web app (KAN-7), a final-rejection status, resubmission limits, amending approved invoices, admin-owned invoices (D6), reports, email, and the v2 list.

## Risks

- Merging alone breaks web approve/reject (`apps/web/src/features/invoices/api.ts:51`). Hold the PR as decided.
- v2 PATCH inherits the breaking change. Note it in the PR and in the v2 section of `APIs_DESIGN.md` (`:163`).
- The guard only holds while every invoice write goes through a guarded repository method. A future `save()` or unguarded `update` call would bypass it, so this rule goes in a comment on the repository class.
- This differs from the spec's mechanism (`optimisticConcurrency`), not from Jira. Note it in the PR.
