---
name: create-pr
description: Open a GitHub pull request for the current feature branch with `gh pr create`, its description filled from `.github/pull_request_template.md` and passed with `--body-file`, behind an explicit approval. Use when asked to open or create a GitHub PR, e.g. "open a PR", "create the pull request".
argument-hint: "[<KAN-key>]"
---

# Create a GitHub pull request

Opens one PR on `origin`, the GitHub repository
(`ngantongkim-agilityio/claude-training`) against `main`. Workflow rules
live in `.claude/rules/git-conventions.md` (title format, one ticket per
PR, approval before creating) and `CLAUDE.md` (never push to `main`, never
force-push); this skill orders them. It duplicates none of them.

`gh pr create` applies the template only in its interactive prompt. With
`--body`, `--body-file`, or `--fill` it ignores the template, so this skill
fills the template itself and passes the result with `--body-file`.

## Precheck (all mandatory, else stop)

1. The current branch is a `<type>/<slug>` feature branch, not `main`.
2. The working tree has no uncommitted changes meant for this PR. Report
   `git status -sb` as observed.
3. The branch exists on `origin`. If not, state the exact push command
   (`git push -u origin <branch>`, feature branch only) and wait for an
   explicit "approve" before pushing. Never push to `main`; never
   force-push. If the remote rejects, report the exact error and stop.

## Procedure

1. **Read the template.** Read `.github/pull_request_template.md` from the
   branch. Use its sections, in order, as the description outline.
2. **Fill it.** Base every section on `git log main..HEAD` and
   `git diff main...HEAD`, plus gate output observed in this session.
   Follow [Body format](#body-format); where it is stricter than the
   template's guidance comments, it wins. Remove all `<!-- -->` guidance
   comments and empty placeholder bullets.
3. **Write the body to a file** outside the repository (for example
   `mktemp`). Never add it to the commit.
4. **Approval.** Show the title (`type(scope): description`, matching the
   commit subject) and the full body. Wait for an explicit "approve". This
   approval covers creating the PR and nothing else.
5. **Create.** Run exactly:

   ```bash
   gh pr create --repo ngantongkim-agilityio/claude-training --base main --head <branch> --title "<title>" --body-file <file>
   ```

   Never use `--fill`, `--fill-first`, `--fill-verbose`, `--body`, `--web`,
   or `--template`: they skip the filled template or need an interactive
   prompt.

6. **Stop.** Report the PR URL. Never merge, enable auto-merge, transition
   Jira tickets, or tag.

## Body format

Keep the body short enough to read in under a minute. Say each fact once,
in the section it belongs to.

- **Summary:** one or two sentences on what changes and why, then the Jira
  key and link (from `$ARGUMENTS` when given).
- **Changes:** three to five high-level bullets by behaviour or area. No
  file-by-file lists, no exhaustive test IDs or case names.
- **Testing:** the key commands run and their results, one bullet each
  (for example `pnpm check` — passed). Anything not run is labelled
  "not run".
- **Risks and follow-ups:** only actionable risks or follow-up work. Omit
  the section when there are none; do not write "None".
- **Checklist:** only the template items that apply, each a ticked
  `- [x]` line. Delete an item that does not apply (for example the docs
  item when no other docs describe the changed behaviour). If an item
  applies but is not true, fix that before the PR or raise it under
  Risks; never leave an unchecked box. Never add items or repeat test
  results here.

Omit any section that would be empty. Leave out completed review history
(resolved comments, earlier iterations, reviewer verdicts), restated
ticket text, and implementation detail the diff already shows.

## Test and validation claims

Quote real output only. The Testing section carries observed results;
anything not run is labelled as not run, never as passing.
