# Task 2: Summarize a vague bug report as a ticket

## Objective

Practice turning a sloppy real-world bug report into a structured, actionable ticket — and learn which prompt details make Claude's summary usable.

## Background

This scenario is built from the real invoice search code. In `apps/tax-invoice-api/src/modules/invoices/invoice.repository.ts` (`findAll`), the search filter is:

```ts
filter.invoiceNumber = { $regex: search, $options: 'i' }
```

Compare with `apps/tax-invoice-api/src/modules/users/user.repository.ts`, which escapes the input before building its `$regex`. A reporter writes this vague message:

> searching invoices is weird when i type special characters, it returns wrong invoices. seems like the search box.

Your job: get Claude to produce a ticket with sections Title, Environment, Steps to reproduce, Actual result, Expected result, Suspected cause — grounded in these two files, not generic MongoDB advice.

## Steps

1. Prompt A (vague): paste the reporter's message almost as-is and ask Claude to summarize the bug.
2. Assess: is it paste-ready? Does it name the exact files and lines? Does it distinguish the invoice behavior from the user-search precedent?
3. Prompt B (refined): add the audience (backend team), the section list, a word limit (under 150 words), the two file paths, and the expected behavior from `docs/APIs_DESIGN.md` ("Search by invoice number (partial match)").
4. Compare: which prompt change (audience, sections, length limit, file evidence) improved the answer most?

## Deliverable

Both prompts, both summaries, and a 3–5 line assessment naming the single most effective prompt change.

## Reflection

- What happens when you don't give Claude the file paths — does it guess or ask?
- How do you check that a "suspected cause" section is grounded in code rather than plausible-sounding?
