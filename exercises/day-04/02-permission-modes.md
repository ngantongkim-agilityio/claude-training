# Modes: permission tour on a throwaway change

## Objective

Feel the difference between `default`, `acceptEdits`, Plan mode, and Auto mode — what each lets Claude do without asking, and where you stay in control.

## Background

Use a single throwaway line in a scratch file under `exercises/day-04/` (e.g. `scratch-modes.md`, deleted afterward — never committed). Ask Claude to append one line, once per mode. Record what you observed, not what documentation claims: how many approval prompts, which actions ran freely, what (if anything) was written before you approved.

## Steps

1. **`default`:** ask for the line. Count the approval prompts (edits + any shell commands). Decline at least once to see what happens.
2. **`acceptEdits`:** ask for the same line again. Note which prompts disappear and which remain.
3. **Plan mode:** ask Claude to plan the one-line change (read the file, write a plan, change nothing). Approve it, then separately reject a follow-up plan to confirm nothing is written without approval.
4. **Auto mode:** ask for a final line, then delete the scratch file. Note what ran without a prompt — and be honest about limits you did not test ("I did not try X, so I do not know where the boundary is").
5. Write the one-paragraph summary: when to use each mode in daily work (e.g. Plan mode to separate "decide" from "do", `default` for untrusted operations, faster modes only with `git status` + hooks as the safety net).

## Deliverable

A modes table (mode / what you did / what you observed) plus the one-paragraph "when to use which" summary. Scratch file removed.

## Review criteria

- Every row describes what you actually saw in your session — no copied claims.
- Untested limits are marked as unknown, not asserted.
- No scratch content committed.

## Reflection

- Which mode would you use for a production hotfix at 5pm, and why?
- What is your personal rule for when Auto mode is off-limits?
