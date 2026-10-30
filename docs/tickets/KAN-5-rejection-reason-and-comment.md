# T2: Require a rejection reason and allow an approval comment

**Jira:** [KAN-5](https://claude-training-dev.atlassian.net/browse/KAN-5) · **Area:** api · **Supporting spec:** [rejection rework spec](https://claude.ai/artifact/3WmYcH7zjJCEEhF2zzyE7y)
**Blocked by:** KAN-4 (T1) · **Blocks:** KAN-6 (T3), KAN-7 (T4)

> Summary for readers without Jira access. Jira is authoritative; if this summary and KAN-5 differ, KAN-5 applies.
> Synced 2026-10-29.

## Goal

Make admins explain a rejection and let them add a comment to an approval, and record the `submitted`, `approved` and
`rejected` events that carry them. The PATCH response stays the same.

## Scope

- A rejection needs a reason: trimmed, 1–500 characters. An approval comment is optional, up to 500 characters.
- A value of only spaces counts as absent. `reason` goes only with `rejected`, `comment` only with `approved`.
- Body validation (400) runs before the 404, 403 and 409 checks, with one message per field.
- Per a Jira comment on KAN-5: `reason` and `comment` are stored on the history entry and returned in the list, detail
  and history responses.
- Out of scope: rejection categories, editing a reason, rejected → submitted and the version check (T3), reports and
  email.

## Key acceptance criteria

- Rejecting with a reason returns 200, and the `rejected` event stores the admin and the trimmed reason.
- Rejecting with no reason, a blank one or one over 500 characters returns 400 and changes nothing.
- Approving stores the trimmed comment when one is given; a comment over 500 characters returns 400.
- A reason or comment sent with the wrong status returns 400.
- Submitting a draft records a `submitted` event with the owner.
- Existing 403/409 results and the `{ invoiceNumber, status }` response are unchanged.
- Validation errors use the exact per-field messages listed in KAN-5.
