# T4: Show rejection reasons and resubmit actions in the web app

**Jira:** [KAN-7](https://claude-training-dev.atlassian.net/browse/KAN-7) · **Area:** web · **Supporting spec:** [rejection rework spec](https://claude.ai/artifact/3WmYcH7zjJCEEhF2zzyE7y)
**Blocked by:** KAN-5 (T2), KAN-6 (T3); uses KAN-4's audit events · **Blocks:** —

> Summary for readers without Jira access. Jira is authoritative; if this summary and KAN-7 differ, KAN-7 applies.
> Synced 2026-10-29.

## Goal

In the web app, Reject takes no reason, Edit and Delete appear only on drafts, and the Submit dialog wrongly says
submitted invoices can't be edited. Add a reason to Reject and a comment to Approve, handle the "invoice changed"
conflict, show the agreed actions per status, and add a rejection banner with Edit and Resubmit.

This ticket merges together with KAN-6, which makes `expectedUpdatedAt` required for approve and reject.

## Scope

- Reason and comment limits match T2 and are also checked in the form.
- Owners see Edit and Delete on draft, submitted and rejected invoices; admins' actions are unchanged.
- A rejected invoice shows a banner with the latest rejection; it is how owners find rework.
- All on-screen text is exactly the client-approved wording in KAN-7.
- Out of scope: the history timeline (T5), dashboard counters, reports and email.

## Key acceptance criteria

- Reject requires a reason (with a 0/500 counter, Confirm disabled while blank); Approve takes an optional comment.
- On an API error or a 409 `INVOICE_CHANGED`, the dialog shows the message (with Reload on 409) and keeps the typed
  text.
- The Submit dialog says the invoice can still be changed and that changes are recorded in history.
- Edit and Delete show for draft, submitted and rejected invoices and are hidden for approved ones.
- A rejected invoice shows the latest rejection's admin, date and reason ("Rejected. No reason was recorded." for
  older invoices), with the owner's Edit and the page's only Resubmit; resubmitting removes the banner.
- The Rejected list filter still shows only the owner's rejected invoices.
