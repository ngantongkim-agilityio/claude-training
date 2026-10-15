# Close: seeded conflict, merge (not rebase), Checkpoint 1

## Objective

Practice the conflict decision Day 02 deferred: when the branch is pushed and shared, integrate with merge instead of rewriting history — then resolve by intent, verify, and clean up.

## Background

On Day 02 (`03-rebase-conflict-workflow.md`) you rebased because your commit was unpublished. Today the situation is different: your `fix/11-...` practice branch is pushed (or a partner has committed to it), so rebasing would rewrite shared history and require a force push — which repo rules forbid. The correct move is merging `main` into your branch.

Seeded-conflict setup: while your practice branch is open, a partner (or your second clone playing the lead) merges a small refactor into `main` touching the same search-filter lines — e.g. extracting the filter construction into a named helper. Your next `git fetch` then shows your MR as conflicted on exactly the lines your fix changed.

## Steps

1. **Fetch and confirm:** `git fetch origin`, verify the conflict is on the search-filter lines (`git diff HEAD...origin/main --stat` should point at `invoice.repository.ts`).
2. **Merge, don't rebase:** `git merge origin/main`. State in your notes why rebase is wrong here (pushed/shared branch; rewrite would need `--force`).
3. **Resolve by intent, not by picking a side:** keeping only your side undoes the refactor; keeping only theirs reintroduces the bug. The right answer composes both — e.g. the escape applied inside the extracted helper. Write one paragraph explaining the intent of each side and why your resolution preserves both.
4. **Verify before committing the merge:** no markers (`grep -c '<<<<<<<\|>>>>>>>\|======='` → 0), target test still passes, full gate (`test`, `typecheck`, `lint`) recorded. Update the MR description with a "Conflict resolution" note.
5. **Finish:** squash-merge the MR into `main` (per repo convention), delete the practice branch locally and remotely, move issue #11 toward Done per the reporter's verification. Fill the Checkpoint 1 table in the Day README from your own evidence.

## Deliverable

- The conflict as shown by Git (which lines, which two intents).
- Your resolution rationale paragraph + post-resolution test output.
- Merge + branch-deletion confirmation and the completed Checkpoint 1 self-assessment.

## Review criteria

- No rebase of shared history, no force push at any point.
- Resolution composes both intents; choosing one side alone would fail either the refactor or the regression test.
- Tests re-run after resolving (a resolution that compiles can still reintroduce the bug — only the #11 test catches that).

## Reflection

- Contrast this with Day 02's rebase: what single fact (published vs unpublished) flips the correct choice?
- What would you do if the conflict were in a file you did not understand? (Who do you ask, what do you run before touching it?)
