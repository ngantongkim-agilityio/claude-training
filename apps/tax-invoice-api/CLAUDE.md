# Backend for Tax Invoice System

## Source of Truth

- API_DESIGN.md is the single source of truth for all API contracts.
- Never modify request/response contracts without explicit instruction.

---

## Architecture

Application flow:

Request
↓
Authentication Middleware
(Local JWT or Auth0 JWT)
↓
Controller
↓
Service
↓
Mongoose Model
↓
MongoDB

Rules:

- Authentication middleware handles token validation.
- Support both Local JWT and Auth0 JWT.
- Controllers handle HTTP request/response concerns only.
- Services contain business logic.
- Controllers must not access Mongoose models directly.
- Services are the only layer allowed to interact with models.
- Keep services focused and domain-driven.
- Do not introduce Repository Pattern unless explicitly requested.

---

## Package Management

This repository uses PNPM exclusively.

CRITICAL:

- Never generate npm commands.
- Never generate yarn commands.
- Never generate bun commands.
- Always use pnpm.

Package installation:

- pnpm add <package>
- pnpm add -D <package>

If a package needs to be installed, propose the exact pnpm command.
Do not execute npm install under any circumstance.

Examples:

✅ pnpm install

✅ pnpm add jwks-rsa

✅ pnpm add -D @types/node

❌ npm install

❌ yarn add

❌ bun add

---

## Authentication

The system currently supports Local JWT Authentication.

Auth0 must be integrated incrementally without breaking existing authentication flows.

Rules:

- Do not remove Local Authentication.
- Do not remove existing JWT logic.
- Auth0 authentication must be backward compatible.
- Prefer extending existing authentication flow over replacing it.
- Reuse existing authorization logic whenever possible.
- Resolve authenticated users into a single MongoDB User model.

Supported authentication sources:

1. Local JWT
2. Auth0 JWT

---

## Validation

- Use Zod v4 for all request validation.
- Each DTO must define:
  - Zod schema
  - z.infer<typeof Schema> type

Rules:

- Never duplicate validation logic in services or controllers.
- Reject invalid input before service execution.
- Validation belongs to the DTO/controller layer.

---

## Database Rules

MongoDB + Mongoose usage rules:

- Use .lean() for read-only queries.
- Use Promise.all() for independent queries.
- Always apply filtering, sorting, and pagination at database level.
- Never filter or sort in memory.
- Always exclude sensitive/internal fields when needed.
- Prefer indexes when introducing searchable fields.

---

## Schema Changes

Before modifying database schemas:

- Analyze current schema usage first.
- Minimize schema changes.
- Preserve backward compatibility.
- Never remove fields used by existing features unless explicitly requested.
- Do not remove Local Authentication fields without explicit instruction.

When adding Auth0 support:

- Extend existing User schema.
- Prefer additive changes over destructive changes.

Example fields:

- authProvider
- authProviderId

---

## Error Handling

Rules:

- Services must throw domain errors only.

- Examples:
  - NotFoundError
  - ForbiddenError
  - ConflictError
  - UnauthorizedError

- Controllers are responsible for translating errors into HTTP responses.

- Avoid generic Error.

- Avoid silent failures.

---

## TypeScript Conventions

- Prefer arrow functions for all new code.
- Avoid function declarations unless required by framework APIs.
- Prefer Promise-based APIs over callbacks.
- Prefer async/await.
- Use const for helper functions.

---

## Testing

Framework:

- Jest
- jest-mock-extended

Rules:

- Do NOT test MongoDB directly in unit tests.

- Always mock external dependencies.

- Always mock Auth0 integrations.

- Service tests must cover:
  - success cases
  - not found
  - forbidden
  - unauthorized
  - invalid transitions
  - business rule violations

- Every new feature MUST include tests.

---

## Comments

Rules:

- Add comments for business rules and non-obvious logic.
- Add comments when implementing authentication, authorization, security, or complex validation.
- Add comments for database queries when the intent is not immediately obvious.
- Add comments before complex algorithms or multi-step workflows.
- Explain WHY the code exists, not only WHAT it does.

---

## Feature Development Workflow

For every new feature:

1. Read API_DESIGN.md first.
2. Confirm request/response contract.
3. Analyze existing implementation.
4. Define or update DTOs (Zod first).
5. Implement service logic.
6. Implement controller changes.
7. Add or update tests.
8. Validate business rules.
9. Verify backward compatibility.

Never skip test generation.

---

## Important Files

Before making changes, always check:

- API_DESIGN.md
- CLAUDE.md

Do not modify these files outside the scope of the task.

---

## Anti-Patterns

Do NOT:

- Introduce Repository Pattern.
- Introduce new architecture patterns without request.
- Refactor unrelated modules.
- Rename existing endpoints.
- Rename existing DTOs.
- Change API contracts silently.
- Replace Local JWT authentication.
- Remove existing authentication flows.
- Add unnecessary abstraction layers.
- Perform in-memory filtering or sorting on large datasets.
- Skip test updates.

Prefer minimal, safe, incremental changes.

---

## Core Principle

Consistency > Optimization

Follow existing patterns in the codebase.

Prefer extending existing implementations over introducing new architecture.
