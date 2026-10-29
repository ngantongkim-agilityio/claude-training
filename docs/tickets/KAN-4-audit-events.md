# T1: Record invoice audit events with actor and event type

**Jira:** [KAN-4](https://claude-training-dev.atlassian.net/browse/KAN-4) · **Area:** api · **Supporting spec:** [rejection rework spec](https://claude.ai/artifact/3WmYcH7zjJCEEhF2zzyE7y)
**Blocked by:** — · **Blocks:** KAN-5 (T2), KAN-6 (T3), KAN-8 (T5)

> Summary for readers without Jira access. Jira is authoritative; if this summary and KAN-4 differ, KAN-4 applies.
> Synced 2026-10-29.

## Goal

Give every invoice an append-only audit trail with event type, actor and server time, so finance can tell auditors
who did what. Today, history records only field edits on submitted invoices, with no actor and no status events.

## Scope

- Event types: `created`, `edited`, `submitted`, `resubmitted`, `approved`, `rejected`, `deleted`.
- The actor is the user's email at the time of the action, stored as a snapshot and never looked up later.
- History is append-only; existing entries from before this change are read as legacy and never rewritten.
- `edited` is recorded only while an invoice is submitted or rejected.
- Out of scope: reason and comment rules (T2), rejected → submitted (T3), slimming embedded `histories`,
  deleted-invoice history, backfill, reports and email.

## Key acceptance criteria

- Creating an invoice records one `created` event with the actor and a server timestamp.
- Editing a submitted invoice records one `edited` event listing only the changed fields; draft edits and no-op
  updates record nothing.
- Deleting records a `deleted` event with the soft delete; the invoice then returns 404.
- Legacy entries come back with `legacy: true` and `actor: null`, and reading them writes nothing.
- `GET /invoices/:id/history` returns entries oldest first to the owner or an admin; other users get 403.
- List, detail and history responses return the same entry fields, and `APIs_DESIGN.md` and `DB_DESIGN.md` describe
  the events.
