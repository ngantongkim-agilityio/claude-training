# Morning: ticket analysis — facts, unknowns, questions

## Objective

Practice reading backlog issues the way a developer should: separate what the issue proves from what you are assuming, and ask the reporter before coding the ambiguous parts.

## Background

Five open issues, five clarity levels. Open each one on GitLab and read the full description before doing anything else:

| Issue | What it is | Clarity |
| --- | --- | --- |
| [#7](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/7) report date validation | Well-specified Task with concrete criteria (`YYYY-MM-DD` shape, reject `2026-02-30`, reject `from > to`) | High — refine edge wording only |
| [#8](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/8) admin draft visibility | Task with a genuine design fork: is `status=draft` for admins intentional or an `if/else` accident? | Medium — needs a reporter decision |
| [#9](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/9) single-sided date filters | Technical Task: `from`-only/`to`-only use raw `new Date(...)` while `from`+`to` uses timezone-aware `getDateRangeUTC` | Medium — needs a helper-choice answer |
| [#10](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/10) dashboard figures look wrong | Deliberately vague Task with no screen, no numbers, no repro | Low — questions only, no criteria |
| [#11](https://gitlab.asoft-python.com/ngan.tongkim/claude-training/-/issues/11) search regex bug | Bug with code evidence and an explicit inspection-vs-runtime boundary | High on cause, pending on runtime proof |

## Steps

1. **Alone first (no Claude):** for each issue, write three short lines — (a) what it asks for, (b) what is ambiguous or missing, (c) the first investigation step. Use the table template under Deliverable.
2. **With Claude:** paste one analysis at a time and ask for gaps ("what did I assume that the issue does not state? cite the issue section or source file"). Keep what survives; discard what does not.
3. **Clarifying questions:** draft questions for #8, #9, and #10. For #8 the questions already exist in the issue — practice asking them as if the reporter had not answered yet. For #10, write at least five questions and mark which answers would unblock the work vs which are nice-to-have. Do not invent acceptance criteria for #10.
4. **Reporter role-play:** in a fresh Claude session, paste the issue plus the instruction "answer only from the issue text; mark anything else as undecided". Ask your questions and record which answers were already in the issue vs newly decided.

## Deliverable

For each issue:

```text
Issue #N — one-line summary
Facts (stated in the issue): ...
Unknowns (not stated): ...
Assumptions I caught myself making: ...
First step: ...
```

Plus: your question lists for #8–#10 and a short role-play log (question → already-stated / new-decision).

## Review criteria

- Every "fact" is traceable to an issue section — no paraphrased guesses.
- #10 has questions but no invented criteria.
- #8's reporter decision is recorded as a decision, not assumed in advance.

## Reflection

- Which of your initial assumptions was the most dangerous (would have led to wrong code)?
- When did Claude's gap-finding point at a real hole vs restate the obvious?
- What is the cheapest question you could have asked the reporter first?
