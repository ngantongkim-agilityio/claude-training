# REVIEW.md — review rubric

One rubric for human and Claude reviewers (for example the `code-reviewer` agent in `.claude/agents/`). Review the diff, not the whole repo.

## Passes

Run in this order:

1. **Security** — secrets, authn/authz, input handling, injection, unsafe dependencies, workflow and hook permissions.
2. **Bugs** — wrong behaviour, edge cases, error handling, data integrity, missing or weak tests.
3. **Compliance** — project rules: root and per-app `CLAUDE.md`, `.claude/rules/git-conventions.md`, and the API contract `apps/tax-invoice-api/docs/APIs_DESIGN.md`.

## Severities

- **Critical** — exploitable security flaw, secret leak, or data loss.
- **High** — wrong behaviour in a main path, or broken authentication/authorization.
- **Medium** — edge-case bug or project-rule violation.
- **Low** — clarity, style, or nit.

## Finding format

`[severity] [pass] path:line — problem — failure case — fix`

Example:

`[High] [Security] apps/tax-invoice-api/src/middlewares/auth.ts:42 — JWT expiry is not checked — an expired token still authenticates — reject expired tokens before resolving the user`

## High-risk paths

Changes here get the Security pass in full.

**Auth**

- `apps/tax-invoice-api/src/middlewares/auth.ts`
- `apps/tax-invoice-api/src/utils/jwt.ts`
- `apps/tax-invoice-api/src/utils/password.ts`
- `apps/web/src/lib/auth.ts`
- `apps/web/src/store/auth-store.ts`
- `apps/web/src/features/auth/**`
- `apps/web/src/app/(auth)/**`

**Data**

- `apps/tax-invoice-api/src/models/**`
- `apps/tax-invoice-api/src/schemas/**`
- `apps/tax-invoice-api/src/configs/**`

**Tooling**

- `.github/workflows/**`
- `.claude/hooks/**`
- `.claude/settings.json`

## Checklist

Security (general checks)

- [ ] No secrets, tokens, or credentials in code, docs, or logs.
- [ ] JWT signature and expiry are verified.
- [ ] Authorization is checked on every protected route.
- [ ] Input is validated before it reaches services.

Authentication (see [API authentication](apps/tax-invoice-api/CLAUDE.md#authentication) and [web authentication](apps/web/CLAUDE.md#authentication))

- [ ] Local JWT authentication and existing JWT logic are kept, not removed.
- [ ] Auth0 support is backward compatible and extends the existing flow.
- [ ] Authenticated users resolve to a single MongoDB User model.
- [ ] Web uses the Auth0 SDK, with no custom auth flows and no manually stored tokens.
- [ ] Web auth logic is centralized and protected routes are guarded.

Tests

- [ ] New behaviour has tests.
- [ ] Tests mock external dependencies and Auth0; no live database.

Contract and tooling

- [ ] No request/response contract change without explicit instruction.
- [ ] Workflow changes: review `permissions`, action pinning, and credential persistence.
