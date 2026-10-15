# Tour: Desktop first session

## Objective

Verify Claude Code Desktop works on this repo and build three session habits: use the sidebar, resume sessions, and keep one topic per session.

## Background

So far this training ran in the terminal. From here the daily driver is Claude Code Desktop's Code tab, pointed at your `claude-training` checkout on branch `feat/exercise-day-4`. Setup follows the Desktop quickstart (see README resources); the notes below are what to record once it runs — not a substitute for reading it.

## Steps

1. **Verify:** open the Code tab on this repo and ask a question only this repo can answer (e.g. "which package manager does this repo use, and where is that rule written?"). Confirm the answer cites `apps/tax-invoice-api/CLAUDE.md` (pnpm exclusively). If the Code tab cannot open the repo, stop and record the blocker — do not invent the tour.
2. **Sidebar:** find where sessions, files/diffs, and settings live. Note in your own words what each area shows.
3. **Resume:** close the session, reopen it with resume, and confirm the earlier context is intact by asking a follow-up that depends on it.
4. **One topic per session:** start a second session on an unrelated small question (e.g. "what does `getDateRangeUTC` do?"). Note why mixing the two topics in one session would have made both harder to follow.

## Deliverable

Session-habit notes: sidebar layout (your words), resume result (worked / failed + what you saw), and one example where you split topics instead of mixing them.

## Reflection

- What breaks when a session mixes two unrelated tasks?
- What will you put in the first message of a session so future-you can resume it cold?
