# T3: Let owners fix, resubmit or delete rejected invoices

**Jira:** [KAN-6](https://claude-training-dev.atlassian.net/browse/KAN-6) · **Area:** api · **Supporting spec:** [rejection rework spec](https://claude.ai/artifact/3WmYcH7zjJCEEhF2zzyE7y)
**Blocked by:** KAN-4 (T1), KAN-5 (T2) · **Blocks:** KAN-7 (T4)

> Summary for readers without Jira access. Jira is authoritative; if this summary and KAN-6 differ, KAN-6 applies.
> Synced 2026-10-29.

## Goal

A rejected invoice is final today, so owners create new ones. Let the owner edit, resubmit (same invoice number) or
soft-delete a rejected invoice, and refuse an admin's approve or reject when the invoice changed after the admin
opened it.

**Breaking API change:** approve and reject must send `expectedUpdatedAt`. This ticket merges together with KAN-7, or
web approve and reject fail.

## Scope

- Only the owner may edit, resubmit or delete a rejected invoice. Resubmitting records `resubmitted`.
- Approved invoices stay final. Any admin may review a resubmitted invoice, including the one who rejected it.
- `PATCH /invoices/:id` checks run in this order: body validation (400), not found (404), permission (403), stale
  `expectedUpdatedAt` on approve or reject (409 `INVOICE_CHANGED`), approved invoice (409 `CANNOT_UPDATE`), invalid
  transition (403 `INVALID_STATUS`).
- Out of scope: a final-rejection status, resubmission limits, amending approved invoices, admin-owned invoice
  workflows, reports and email.

## Key acceptance criteria

- The owner can edit a rejected invoice (it stays rejected), resubmit it (submitted, same number) or delete it; each
  action appends its event.
- Anyone else, admins included, gets 403 on those actions; approved invoices still return 409 to the owner.
- With a current `expectedUpdatedAt`, asking a rejected invoice for `approved`, `rejected` or `draft` returns 403
  `INVALID_STATUS`.
- A missing or malformed `expectedUpdatedAt` on approve or reject returns 400, as does sending it with `submitted`.
- A stale `expectedUpdatedAt` returns 409 `INVOICE_CHANGED` and changes nothing, even when another admin has already
  approved or rejected the invoice.
- Of two simultaneous saves of one invoice, one succeeds and the other gets 409 `INVOICE_CHANGED`.
