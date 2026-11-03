# How I Work with Claude

**Interactive version:** [How I Work with Claude](https://claude.ai/artifact/DwGtBqpoHvwxJZ12WShGnv)

> Claude helps me move faster, but **I own the requirements, the code, the verification, and the final decision**.

## Daily workflow

1. `/analyze-ticket`: understand the ticket, requirements, scope, and acceptance criteria.
2. `/plan-ticket`: create a plan in Plan Mode. I approve it before implementation starts; if not, revise the plan.
3. `/implement-ticket`: implement the approved plan.
4. **Run checks and tests**: verify with the relevant project commands and read the real results.
5. `/code-review`: review locally before creating a PR. If it finds issues, fix them and review again.
6. **Ultrareview** (risky branches only): run a multi-agent cloud review with `/code-review ultra`. Other tickets skip this step.
7. `/ship-ticket`: prepare and ship the completed work according to the project's workflow.
8. `/create-pr`: create a GitHub pull request.
9. **After the PR opens**: CI, `@claude` review, then my final review and merge (layers 3–5 below).

## Five review layers

Each layer has a different job. They complement each other, and none replaces another.

1. **Local code review** (`/code-review`): does this change hold up before anyone else sees it? Look for bugs, logic issues, security concerns, and maintainability problems.
2. **Deep review** (Ultrareview, conditional): what would a single pass miss on this risky branch? It catches what tired humans miss. It is an additional layer, not a mandatory step for every ticket.
3. **Automated CI** (GitHub Actions): do the project's checks, such as typecheck, lint, tests, and build, pass on the pushed code? If CI fails: investigate, fix, push, and wait for CI to pass.
4. **AI PR review** (`@claude` on GitHub): what does a fresh read of the whole PR find? Inspect its findings, address valid feedback, run checks again, push fixes, and request another review when necessary.
5. **Human final review** (me, required): should this be merged? Review the final diff, CI results, and review feedback. Merge only after all required checks and approvals are satisfied.

## Parallel work with Git worktrees

> Two tickets in flight, two isolated agents, zero crosstalk.

- Give each independent ticket its own Git worktree, branch, and Claude Code session with its own context.
- Each ticket produces its own PR, which is reviewed and merged on its own.
- Resolve dependencies sequentially, never in parallel.
- Keep it manageable: typically 2–3 independent sessions.

## Monitoring with `/loop`

Recurring checks while a Claude Code session remains open. `/loop` checks the open PR and CI and reports to me; I decide.

- `/loop 15m`: check an open PR for new review comments and unresolved issues.
- `/loop`: monitor CI failures and report what needs attention.
- `/loop 5m check the deploy`: check deployment status.
- **Morning maintenance**: review open PRs, CI failures, and outstanding maintenance tasks.

Recurring instructions can also be defined in `loop.md`, and `Esc` stops the loop. `/loop` never approves a plan or PR, merges, deploys, or authorizes a risky action on its own.

## Engineering habits

- **Real browser verification:** always run the application and check UI and chat changes in a real browser. Verify the rendered behavior and important user flows. Do not rely only on code inspection, screenshots of code, or automated tests. For chat changes, verify the actual conversation, interactions, and responses where applicable.
- **Short feedback loops:** implement, verify, review, and address issues in small iterations instead of accumulating a large unverified diff.
- **Evidence-based verification:** run relevant commands and tests, and confirm actual results before reporting completion.
- **Focused changes:** keep changes small, incremental, and easy to review. Avoid unrelated modifications.

## Reusable prompts

Replace the values in angle brackets.

**Ticket analysis**

```text
/analyze-ticket <TICKET>
Summarize the requirements, scope, and acceptance criteria. List what is unclear or missing. Ask only the questions I need to decide. Do not write code.
```

**Planning with Plan Mode**

```text
/plan-ticket <TICKET>
Use Plan Mode. Read the relevant code first, then propose the approach, affected files, risks, and how each step will be verified. Stop for my approval before implementing.
```

**Implementation and verification**

```text
/implement-ticket <TICKET>
Implement only the approved plan and keep the diff focused. Run the relevant checks and tests and report the real output. If something was not run, say so.
```

**Real browser UI and chat verification**

```text
Run the app and check this change in a real browser. Walk through <USER FLOW> and report what actually rendered and happened. For chat changes, send real messages and check the conversation, interactions, and responses. List anything you could not verify.
```

**Local code review**

```text
/code-review
Review the current changes for bugs, logic issues, security concerns, and maintainability problems. Rank findings by severity, with file and line.
```

**Ultrareview for risky branches**

```text
/code-review ultra

When the findings arrive: check each one against the code, tell me which are valid and why, fix only those I confirm, then run the checks again.
```

**PR review and addressing feedback**

```text
On GitHub:
@claude review this PR for bugs, security issues, and missing tests.

In Claude Code:
Read the review comments and CI results on PR <NUMBER>. For each one, tell me whether it is valid and why. Fix the valid ones, run the checks again, and show me the diff before pushing. Do not merge.
```

## Guardrails

- Clarify requirements before implementation.
- Plan first for complex or risky changes.
- Human approval before important plans and actions.
- One ticket per branch and PR.
- Keep diffs small and focused.
- Verify with real commands, tests, and browser checks.
- Never claim checks passed if they were not run.
- Never expose secrets or customer data.
- Never push directly to protected branches.
- Ask before destructive Git operations or force pushes.
- AI review does not replace human accountability.
- Remain accountable for the final PR and merge decision.
