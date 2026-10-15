# Git block: read history, rebase, resolve a conflict

## Objective

Practice the Git moves that keep shared branches clean: read what the remote has before integrating, keep your own unpushed work linear with `pull --rebase`, and resolve a conflict without losing anyone's work.

## Background

Use a scratch file inside `exercises/day-02/` (e.g. `git-scratch.md`) — never a real source or exercise file. The scenario mirrors the most common real conflict: two people append content at the same end of the same file.

Setup (two clones or two branches of this repo):

1. Partner (or your second clone) creates branch `practice/rebase-demo`, appends a section to `git-scratch.md`, commits, and pushes first.
2. You, on your own checkout of the same branch from the pre-push state, append a different section to the same end of the file and commit locally.

## Steps

1. **Push and get rejected:** `git push -u origin HEAD` → expect `! [rejected] ... (fetch first)`. Never `--force` here.
2. **Read before integrating:** `git fetch origin`, then `git log --oneline --graph HEAD origin/practice/rebase-demo -4` and `git diff HEAD...origin/practice/rebase-demo --stat`. Note where the histories split and which file overlaps — the conflict should be expected, not a surprise.
3. **Rebase:** `git pull --rebase origin practice/rebase-demo`. Read the conflict markers carefully — during a rebase, `HEAD` (upper side) is the upstream commit your work is replayed onto, and the lower side is your own commit.
4. **Resolve:** keep both sections (theirs first, then yours), remove all markers, verify with `grep -c '<<<<<<<\|>>>>>>>\|======='` returning 0.
5. **Verify before continuing:** re-read the merged file end to end, then `git add` + `git rebase --continue`. Confirm linear history with `git log --oneline --graph -3`, then push (fast-forward, no force needed).

## Deliverable

- The rejected-push output, the graph + three-dot diff output, and the final linear log.
- One paragraph: what the graph told you before the rebase, and why rebase (not merge) was right here — your commit was unpublished, so rewriting it affects only you.

## Review criteria

- No force push at any point.
- Both sections survive in the resolved file; no markers remain.
- Final history is linear (your commit on top with a new hash, no merge commit).

## Reflection

- When would you merge `main` into your branch instead of rebasing? (Hint: Day 03 revisits this when the branch is already pushed and shared.)
- What does the three-dot diff (`A...B`) show that the two-dot diff does not, and why does it matter before integrating?
