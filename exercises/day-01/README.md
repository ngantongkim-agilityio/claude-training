# Day 01: Explore, Prompt, Reflect

Learn to use Claude Code on a real codebase: explore the Tax Invoice API, ask it work questions with improving prompts, and judge the quality of what comes back.

- **Area:** Backend, Express + TypeScript (Mongoose, MongoDB, Zod v4, Jest)
- **Project:** `apps/tax-invoice-api/` in this repository
- **Language:** English
- **Tool:** Claude Code in this repo (branch `feat/exercse-day-1`)
- **Method:** each task is done twice — once with a vague prompt, once with a refined prompt — so the effect of the prompt change is visible. Record both attempts and what changed.

## Scenario

All five tasks use the real Tax Invoice API: invoice status workflow (`draft → submitted → approved/rejected`), Zod validation in DTOs, and the service/controller/mongoose layering described in `apps/tax-invoice-api/CLAUDE.md`. Nothing here modifies application code; Day 01 is read-only plus Markdown notes.

## Contents

| File | Task |
| --- | --- |
| [01-explore-codebase.md](01-explore-codebase.md) | Navigate the API and explain how a request flows |
| [02-summarize-ticket.md](02-summarize-ticket.md) | Turn a vague bug report into a structured ticket |
| [03-explain-concept.md](03-explain-concept.md) | Get a focused explanation of a project concept |
| [04-drafting.md](04-drafting.md) | Draft a work message from real project facts |
| [05-learnings.md](05-learnings.md) | What changed the answers, what was surprising |

## Key project facts (used across tasks)

- Stack: Express 5, TypeScript, Mongoose + MongoDB, Zod v4 for DTO validation, Jest with mocked models (never a live DB in unit tests).
- Flow: middleware (auth) → controller → service → Mongoose model, per `apps/tax-invoice-api/CLAUDE.md`.
- Invoice statuses: `draft → submitted → approved/rejected` (`src/types/invoice.ts`, `updateInvoiceStatus` in `src/modules/invoices/invoice.service.ts`).
- Validation lives in DTO schemas (`src/modules/invoices/invoice.dto.ts`, `src/modules/reports/report.dto.ts`); services throw domain errors (`NotFoundError`, `ForbiddenError`, `ConflictError`).
- Quality gate for this API: `pnpm --filter @repo/api test <target>`, `typecheck`, `lint` (see `apps/tax-invoice-api/package.json`).
- Package manager is pnpm exclusively — never npm/yarn/bun.

## Deliverables

- All five files filled in with both prompt attempts, results, and your assessment.
- `05-learnings.md` completed: at least three prompt techniques that improved answers, and at least one surprising or incorrect AI output with how you caught it.
- No application code changed (`git status` shows only `exercises/day-01/`).
