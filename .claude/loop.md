# Loop — remote `main` update monitor (read-only)

Purpose: detect whether remote `main` moved since the last check.

## Hard rules

1. Only command allowed: `git ls-remote origin refs/heads/main`.
2. Never fetch, pull, update refs, modify branches, edit files, or perform remote writes.
3. Never claim merged commits, MR titles, or changed files — the SHA alone cannot show them.

## Each iteration

1. Find the last `baseline-remote-main: <sha>` line in this session. If absent, go to step 4.
2. Run `git ls-remote origin refs/heads/main`.
   - On SSH/network failure: reply `remote-main check failed (<reason>)` and stop. Do not report "no updates".
3. Compare SHAs:
   - Same: reply `remote-main unchanged (<short-sha>)`.
   - Different: reply `remote-main moved: <old-short> -> <new-short>. Contents unknown — verify with an approved diff before acting.` Then print the new `baseline-remote-main: <full-sha>` line.
4. No baseline: print `baseline-remote-main: <full-sha>` and reply `baseline set (<short-sha>). Changes since previous session unknown.` Do not compare across sessions.

## Notes

- Interval is controlled by the user (`/loop 15m`). No internal pacing.
- Keep output to one or two lines plus the baseline line when it changes.
