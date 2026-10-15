# Day 04: Desktop, Permissions, Daily Loop

Set up Claude Code Desktop on this repo, learn what each permission mode lets Claude do, verify an AI explanation against source, and run a full ticket-to-MR loop twice — guided once, solo once.

- **Area:** Backend, Express + TypeScript (Mongoose, MongoDB, Zod v4, Jest)
- **Project:** `apps/tax-invoice-api/` in this repository
- **Language:** English
- **Tool:** Claude Code Desktop — Code tab, on this repo (branch `feat/exercise-day-4`)
- **Method:** tour first (sessions, sidebar, resume), then permission modes on a throwaway change, then explore-and-verify, then two full ticket loops.

## Resources

- Claude Code 101: https://dojo.agilityio.dev/courses.html#developer
- Claude Code in Action: https://dojo.agilityio.dev/courses.html#developer
- Quickstart: https://code.claude.com/docs/en/quickstart
- Desktop quickstart: https://code.claude.com/docs/en/desktop-quickstart
- Common workflows: https://code.claude.com/docs/en/common-workflows
- Best practices: https://code.claude.com/docs/en/best-practices

## Scenario

Days 01–03 taught prompting, ticket analysis, and fix-review-merge using issues #7–#11. Day 04 moves that practice into Claude Code Desktop as the daily driver: the same Tax Invoice API, the same quality gate (`pnpm --filter @repo/api test <target>`, `typecheck`, `lint:check`), the same branch/MR conventions — but now through Desktop sessions, permission modes, Plan mode, and the diff pane.

## Contents

| File | Part |
| --- | --- |
| [01-desktop-first-session.md](01-desktop-first-session.md) | Tour: Code tab, sidebar, resume, one topic per session |
| [02-permission-modes.md](02-permission-modes.md) | Modes: default, acceptEdits, Plan mode, Auto mode on a throwaway change |
| [03-explore-and-verify.md](03-explore-and-verify.md) | Explore: explain a real feature, verify two claims in source |
| [04-ticket-to-pr-workflow.md](04-ticket-to-pr-workflow.md) | Loop: guided ticket-to-MR, then a second ticket solo |

## Key project facts (used across tasks)

- Stack: Express 5, TypeScript, Mongoose + MongoDB, Zod v4 for DTO validation, Jest with mocked models (never a live DB in unit tests — see `apps/tax-invoice-api/CLAUDE.md`).
- Suggested feature for task 03: the invoice `search` filter in `findAll` (`src/modules/invoices/invoice.repository.ts`, unescaped `$regex`) vs the escaped user-email precedent (`src/modules/users/user.repository.ts`); contract `docs/APIs_DESIGN.md` ("Search by invoice number (partial match)").
- Suggested tickets for task 04: issue #11 (search regex escape — fix mirrors an existing precedent, ideal guided run) then issue #7 (report date validation) or #9 (single-sided date filters) solo.
- Quality gate: `pnpm --filter @repo/api test <target>`, `typecheck`, `lint:check`; pnpm exclusively.
- Branch/MR conventions: `fix/<issue>-<short-kebab>` branches, small focused commits, MR with Summary / Changes / Testing / Risks + `Related to`, squash merge, delete branch after merge.

## Completion checklist

- [ ] Desktop Code tab opens this repo; sidebar and resume explored; one-topic-per-session practiced (`01`).
- [ ] All four modes tried on a throwaway change with observations recorded; file removed afterward (`02`).
- [ ] One feature explained by Claude; two claims independently verified against source with results (`03`).
- [ ] Guided ticket loop completed through MR draft (`04` part A).
- [ ] Second ticket completed independently, without assistance (`04` part B).
- [ ] Only `exercises/day-04/` notes added; practice code stayed on disposable branches.
