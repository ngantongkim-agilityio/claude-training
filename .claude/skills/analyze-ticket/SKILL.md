---
name: analyze-ticket
description: Inspect one Jira ticket (project KAN) for readiness — clear ask, acceptance criteria or reproduction steps, dependencies, scope fit for one PR — investigate the repo for facts, and report what is missing or ask only genuine decisions. Use when asked whether a ticket is ready, e.g. "is KAN-6 ready?", "analyze KAN-6", "what's missing on KAN-6".
argument-hint: "<KAN-key>"
---

# Analyze a ticket

Read-only readiness check for one Jira ticket, `KAN-<n>`, the source of truth
for its requirements, acceptance criteria, dependencies and status. The rules
behind readiness live in `CONTRIBUTING.md` (one ticket per PR, focused
changes) and `CLAUDE.md` (shared rules); this skill is the order to apply them
in, not a copy of them.

## Procedure

1. **Read the ticket.** Use the Atlassian MCP: `getJiraIssue` (view
   `evidence`, which includes links) and `listJiraIssueComments`. If the
   ticket does not exist, stop and say so. A linked spec is supporting
   detail; if it differs from the ticket, the ticket applies and the
   difference is a gap to report.
2. **Readiness check.** Against `CONTRIBUTING.md`: a clear ask; acceptance
   criteria (features) or reproduction steps (bugs); small enough for one PR.
   If any element is missing, record it as a gap — do not fill it in by
   guessing.
3. **Dependencies.** For each "is blocked by" link, read that ticket. If any
   is not in the Done status category, stop and report which one blocks, and
   what state it is in.
4. **Investigate the repo for facts.** Current behavior, related code and
   tests, past PRs, and — for API work — `apps/tax-invoice-api/CLAUDE.md`
   and the contract source of truth it names
   (`apps/tax-invoice-api/docs/APIs_DESIGN.md`). Anything the repo already
   answers is a fact, never a question.
5. **Report.** One message: ready or not ready; the gap list (if any); the
   facts found with `path:line` or PR references. If ready, end with:
   `plan-ticket <KAN-key>` is the next step.

## Decisions (only when ready-adjacent)

If exactly the decision is the user's to make (product intent, scope
tradeoff), ask one question at a time, each with a labeled recommendation
and one line of why. Never stack questions. Never ask what step 4 already
answered.

## Jira writes (exception, never default)

This skill ends at the report. It edits the ticket or posts a comment **only**
when the user explicitly approves a specific write after reviewing its exact
content: show the full text to be posted, wait for "approve", then perform
that write and nothing else. An approval of the report is not an approval
to write.

## Test and validation claims

Every claim about behavior, tests, or validation in the report must rest on
actual output observed in this session. Never assert a test passes, a bug
reproduces, or a check is green without the command output to quote.
