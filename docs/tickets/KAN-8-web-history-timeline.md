# T5: Show the invoice history timeline on the web detail page

**Jira:** [KAN-8](https://claude-training-dev.atlassian.net/browse/KAN-8) · **Area:** web · **Supporting spec:** [rejection rework spec](https://claude.ai/artifact/3WmYcH7zjJCEEhF2zzyE7y)
**Blocked by:** KAN-4 (T1) · **Blocks:** —

> Summary for readers without Jira access. Jira is authoritative; if this summary and KAN-8 differ, KAN-8 applies.
> Synced 2026-10-29.

## Goal

Owners and admins can't see an invoice's history in the web app. Add a History section to the invoice detail page
that shows every event with its actor, time, reason or comment and field changes, including entries from before audit
tracking. It can be built in parallel with KAN-5 to KAN-7 once KAN-4 merges.

## Scope

- Events show newest first; only the display is reversed, and the API stays oldest first.
- Every entry is shown, with no paging or collapsing.
- The timeline uses the detail response's `histories`, with no call to `/history`.
- Amounts use the detail page format; a missing value shows "—". Labels and legacy text are the approved wording in
  KAN-8.
- Out of scope: paging, collapsing or filtering, calls to `GET /invoices/:id/history`, deleted invoices, reports.

## Key acceptance criteria

- The owner or an admin sees every event newest first, with its label, actor email and local date and time.
- Rejections show their reason, approvals their comment when there is one.
- Edited events read "Field: old → new".
- Legacy entries and invoices without history show the approved text ("No history recorded yet." when empty).
- The timeline follows the page's loading and error states and makes no separate request.
- After an action on the page succeeds, the new event appears at the top without a manual reload.
