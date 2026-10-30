# Plan: KAN-5 (T2) Require a rejection reason and allow an approval comment

**Jira:** [KAN-5](https://claude-training-dev.atlassian.net/browse/KAN-5) · **Status:** approved 2026-10-29 ·
**Written:** 2026-10-29

> Implementation plan only. KAN-5 in Jira is authoritative for requirements and acceptance criteria; if this plan and
> the ticket differ, the ticket applies.

## Context

An admin can reject an invoice without saying why, an approval can't carry a comment, and status changes leave no
history event. KAN-5 requires a reason to reject, allows an optional comment on approval, and records `submitted`,
`approved` and `rejected` events that carry them. It builds on KAN-4 (Done).

## Contract (all additive, all approved)

- `PATCH /invoices/:id` body gains optional `reason` and `comment`. The response stays `{ invoiceNumber, status }`.
- History entries in `GET /invoices`, `GET /invoices/:id` and `GET /invoices/:id/history` gain `reason` and
  `comment`, each present only when stored (Jira comment 10001).
- A status change that loses a race gets the existing 409 `CANNOT_UPDATE` (R1).

## Review decisions

| #   | Decision                                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------- |
| R1  | One guarded `findOneAndUpdate` (status read + not deleted) sets the status and pushes the event; no match → 409 |
| R2  | A `reason` or `comment` that isn't a string, or is `null`, gets `Reason is invalid` / `Comment is invalid`      |
| R3  | Tests cover both fields wrong at once, `rejected` with a comment, and length as JS `.length`                    |
| R4  | Jest runs use `pnpm --filter @repo/api test <pattern>`, without `--`                                            |
| R5  | The worktree needs `pnpm install` and a local `.env` with fake values before any check                          |
| R6  | Field rules are described with `.openapi()`, since `superRefine` rules don't appear in the generated schema     |
| R7  | The legacy branch of the history mapper is unchanged                                                            |
| R8  | The v2 list returns stored histories unmapped, so it shows the new fields too; no code change, noted in the PR  |
| R9  | `docs/tickets/KAN-5-…` notes comment 10001                                                                      |

## Scope

In: the PATCH DTO and validation, the controller pass-through, the guarded status update, the three status events,
`reason` and `comment` on the history model, types, mapper and response schema, Swagger, `APIs_DESIGN.md`,
`DB_DESIGN.md` and the ticket record.

Out: rejection categories, editing a reason, rejected → submitted and `expectedUpdatedAt` (KAN-6), reports, email,
the web app (KAN-7, KAN-8), the v2 list's history shape, and admin-owned invoices (D6).

## Steps

Paths are under `apps/tax-invoice-api/src/`. Each step's tests are written first and ship with its code.

1. **Messages** (`constants/errors.ts`): add `MUST_BE_AT_MOST` and `ONLY_ALLOWED_WHEN_STATUS`; reuse `IS_REQUIRED`
   and `IS_INVALID`.
2. **DTO** (`modules/invoices/invoice.dto.ts`): `reason` and `comment` are trimmed optional strings; one
   `superRefine`, following `checkDateOrder`, applies the rules as an if/else chain so each field gets at most one
   message (`parseRequest` keeps only the last per field). Blank after trimming counts as absent.
3. **Controller**: pass `reason` and `comment` to the service. The body is parsed first, so a bad body gets 400 before
   any 404, 403 or 409 check.
4. **Model and types**: optional `reason` and `comment` on the history schema, `InvoiceHistory` and
   `InvoiceHistoryEntry`.
5. **Repository and service**: `updateStatus` in the repository (R1). The service keeps the existing checks, builds
   the event (new status, actor, reason or comment) and throws `ConflictError` when the update matches nothing.
6. **History responses**: the shared mapper adds `reason` and `comment` to recorded entries only; the response
   schema gains both as optional.
7. **Swagger and docs**: PATCH 400 description; a PATCH body section in `APIs_DESIGN.md` with the rules and
   messages; `reason` and `comment` rows in the history table and in `DB_DESIGN.md`; only `resubmitted` stays
   reserved.

## Tests

All unit-level with models mocked, per `apps/tax-invoice-api/CLAUDE.md`.

- **DTO:** trimming, missing or blank reason, 500/501 characters for both fields, wrong-status pairings, blank values
  with another status, two fields wrong at once, non-string and `null`, and the exact five messages (AC-2, AC-3,
  AC-4, AC-7; TC-16, TC-18, TC-19, TC-23).
- **Controller:** pass-through, trimming through the real schema, and a non-admin bad body getting 400 without
  reaching the service (TC-60).
- **Service:** each event with its actor and reason or comment, no `comment` key when none is given (AC-1, AC-3,
  AC-5); 404, 403, 409 and invalid transitions write nothing (AC-6); a lost race gets 409 (R1).
- **Mapper and schema:** `reason` and `comment` kept, absent keys stay absent, legacy entries unchanged.

## Validation

- verify: `pnpm --filter @repo/api check`
- verify: `pnpm check` from the repository root
- verify: the generated OpenAPI document shows `reason` and `comment` on the PATCH body and on history entries
- verify: `git diff --stat main` lists only the files named in this plan

Then a self-review and one independent `code-reviewer` pass. Work stops before committing, as `implement-ticket`
requires.

## Open risks

- An admin can still decide on a version they never saw; KAN-6 (`expectedUpdatedAt`) closes that.
- R8: the v2 list and v2 PATCH pick up the new fields and rules.
