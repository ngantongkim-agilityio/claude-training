<!--
Title: `type(scope): description` — imperative, at most 72 characters, no
trailing period. Rules: .claude/rules/git-conventions.md
Remove these guidance comments before creating the PR.
-->

## Summary

<!-- What changes and why, in one to three sentences. -->

<!-- Link the ticket: `Closes #N` (GitHub issue) or `Related to <GitLab issue URL>`. -->

## Changes

<!-- One bullet per file or area: what changed there and why. -->

-

## Testing

<!--
Commands run and their real results, e.g. `pnpm check` or
`pnpm --filter @repo/api check`. Label anything not run as "not run".
Call out failures that already happen on `main`.
-->

-

## Risks and follow-ups

<!-- Behaviour changes, setup or migration notes, deferred work. Write "None" if there are none. -->

## Checklist

- [ ] Branch is `<type>/<slug>` from `main` and covers one ticket
- [ ] Commit subject follows `type(scope): description`
- [ ] No secrets, tokens, or `.env` values committed
- [ ] Docs updated where behaviour changed (`CLAUDE.md`, `CONTRIBUTING.md`, app `README.md`)
- [ ] `pnpm check` run, or any failure explained under Testing
