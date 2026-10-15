# Task 4: Draft a work message from real facts

## Objective

Practice using Claude to draft workplace writing that is accurate because the prompt supplies the facts — then editing it like an owner, not pasting blindly.

## Background

Scenario: you explored the report DTOs and noticed `from`/`to` in `apps/tax-invoice-api/src/modules/reports/report.dto.ts` are `z.string().min(1)` with no date-format check. Draft a short Slack message to the team proposing a validation task, referencing the real file and the DTO-layer rule from `apps/tax-invoice-api/CLAUDE.md`.

## Steps

1. Prompt A (vague): `draft a message to the team about validating report dates`.
2. Assess: does it name the file, the current schema, and the concrete proposal — or generic filler? Would you send it as-is?
3. Prompt B (refined): supply the file path, the current declaration (`z.string().min(1)`), the rule (validation in DTO layer), the audience (backend team on Slack), the length (under 100 words), and the tone (direct, one clear ask).
4. Edit the draft by hand: fix anything inaccurate, cut filler, make the ask explicit. Mark your edits.

## Deliverable

Both prompts, the raw Claude draft, and your edited version with edits marked (e.g. strikethrough/bold or a short edit list).

## Reflection

- What facts must always be in the prompt when Claude drafts about your codebase?
- What did you change by hand, and why wouldn't you let Claude make those calls?
