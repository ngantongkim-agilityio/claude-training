# Intent: invoice rejection, rework and audit trail

**Status:** Client-approved, developer-reviewed (2026-10-28) **Last updated:** 2026-10-29

> What is wanted, why, and under which constraints. Requirements are not restated here.
> Jira project KAN (KAN-4 to KAN-8) is authoritative for requirements, acceptance criteria, dependencies and status.
> The spec is supporting detail: it can refine how a story's criteria are built and tested, but it cannot add scope or
> change a criterion. That needs a Jira edit.

**Supporting spec:** [Invoice rejection, rework and audit trail](https://claude.ai/artifact/3WmYcH7zjJCEEhF2zzyE7y)
(v7: business rules BR-1–BR-15, decision log, detailed acceptance criteria, QA matrix TC-01–TC-71, developer review
log).

## What is wanted

- A rejection always carries a reason, and an approval can carry a comment.
- An owner can edit, resubmit or delete a rejected invoice, and it keeps its invoice number.
- Each invoice has an append-only audit trail showing who did what, when and why.
- The web app matches the real business rules: it neither hides allowed actions nor states rules that don't exist.

## Why

A rejected invoice is final today, so staff don't know what was wrong and create a new invoice to try again. Finance
can't tell auditors why an invoice was rejected, because no reason or decision-maker is stored.

## Constraints

- Both `apps/tax-invoice-api` and `apps/web` are in scope (spec decision Q18).
- API changes only add to the contract, except one approved breaking change: `expectedUpdatedAt` is required to
  approve or reject (T3-DQ3). `APIs_DESIGN.md` and `DB_DESIGN.md` change in the same PRs.
- Existing history is never rewritten; entries from before this release are read as legacy (BR-13).
- Out of scope: report and email changes, a final-rejection status, resubmission limits, amending approved invoices,
  viewing deleted invoices, admin-owned invoice workflows (D6), v2 list and dashboard counter changes.
- Fake data only.

## Tickets

| Ticket                            | Jira                                                            | Supporting spec criteria | Supporting spec test cases      |
| --------------------------------- | --------------------------------------------------------------- | ------------------------ | ------------------------------- |
| T1 Audit events (api)             | [KAN-4](https://claude-training-dev.atlassian.net/browse/KAN-4) | T1-AC1–AC14              | TC-01–TC-15, TC-55–TC-59        |
| T2 Reason and comment (api)       | [KAN-5](https://claude-training-dev.atlassian.net/browse/KAN-5) | T2-AC1–AC12              | TC-16–TC-26, TC-60, TC-61       |
| T3 Rework rejected invoices (api) | [KAN-6](https://claude-training-dev.atlassian.net/browse/KAN-6) | T3-AC1–AC16              | TC-04, TC-27–TC-37, TC-62–TC-66 |
| T4 Web review and rework actions  | [KAN-7](https://claude-training-dev.atlassian.net/browse/KAN-7) | T4-AC1–AC11              | TC-38–TC-46, TC-67–TC-69        |
| T5 Web history timeline           | [KAN-8](https://claude-training-dev.atlassian.net/browse/KAN-8) | T5-AC1–AC9               | TC-47–TC-53, TC-70, TC-71       |

- Each story's acceptance criteria are the requirement. The spec's detailed criteria and matrix guide implementation
  and testing; where they conflict with Jira, Jira applies.
- Dependencies are the `Blocks` links in Jira.
- T3 and T4 merge together, because T3 makes `expectedUpdatedAt` required for the web app's approve and reject.
- T5 can run in parallel with T2–T4 once T1 merges. TC-54 is the release check, run once T1–T5 are all merged.
