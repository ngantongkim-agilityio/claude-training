# 📘 APIs DESIGN

> Base path: `/api/v1`
>
> API docs path: `/api/v1/docs`
>
> Auth:
>
> - 🔓 Public
> - 🔒 Authenticated (Local JWT or Auth0 JWT)
> - 👑 Admin

---

## 🔐 Auth APIs

| Method | Endpoint       | Auth | Description   |
| ------ | -------------- | ---- | ------------- |
| POST   | /auth/register | 🔓   | User register |
| POST   | /auth/login    | 🔓   | Login + JWT   |

### Authentication

The application supports:

- Local JWT authentication
- Auth0 authentication

Protected endpoints accept:

```http
Authorization: Bearer <local-jwt>
```

or

```http
Authorization: Bearer <auth0-access-token>
```

---

## 👤 User APIs

| Method | Endpoint             | Auth | Description                           |
| ------ | -------------------- | ---- | ------------------------------------- |
| GET    | /me                  | 🔒   | Get current user                      |
| GET    | /users               | 👑   | List users                            |
| GET    | /users?email={email} | 👑   | Search users by email (partial match) |

### Query Parameters

#### GET /users

| Param | Type   | Required | Default | Description                                       |
| ----- | ------ | -------- | ------- | ------------------------------------------------- |
| email | string | No       | -       | Search users by email (partial, case-insensitive) |
| page  | number | No       | 1       | Page number                                       |
| limit | number | No       | 10      | Records per page                                  |

Examples:

```http
GET /users?page=1&limit=10
```

```http
GET /users?email=user@example.com
```

```http
GET /users?email=user&page=1&limit=10
```

---

## 🧾 Invoices APIs

| Method | Endpoint      | Auth | Description                                                                              |
| ------ | ------------- | ---- | ---------------------------------------------------------------------------------------- |
| GET    | /invoices     | 🔒   | Get list of invoices                                                                     |
| GET    | /invoices/:id | 🔒   | Get detail of 1 invoice                                                                  |
| POST   | /invoices     | 🔒   | Create a new invoice (initial status: `draft`). Records a `created` event.               |
| PUT    | /invoices/:id | 🔒   | Update invoice. Changes to a submitted invoice record an `edited` event.                 |
| PATCH  | /invoices/:id | 🔒   | Update invoice status (`draft → submitted`, `submitted → approved/rejected`).            |
| DELETE | /invoices/:id | 🔒   | Soft delete invoice (`isDeleted = true`) and record a `deleted` event in the same write. |

### Query Parameters

#### GET /invoices

| Param  | Type   | Required | Default   | Description                                |
| ------ | ------ | -------- | --------- | ------------------------------------------ |
| search | string | No       | -         | Search by invoice number (partial match)   |
| status | string | No       | -         | Filter by invoice status                   |
| from   | string | No       | -         | Filter from date (YYYY-MM-DD)              |
| to     | string | No       | -         | Filter to date (YYYY-MM-DD, inclusive)     |
| sortBy | string | No       | createdAt | Sort field ( amount, createdAt, updatedAt) |
| order  | string | No       | desc      | Sort order (asc, desc)                     |
| page   | number | No       | 1         | Page number                                |
| limit  | number | No       | 10        | Records per page                           |

Examples:

```http
GET /invoices?page=1&limit=10
GET /invoices?search=INV-00&status=draft
GET /invoices?from=2026-01-01&to=2026-06-30
GET /invoices?sortBy=updatedAt&order=asc
```

#### PATCH /invoices/:id

Request body:

| Field     | Type   | Required        | Description                                                          |
| --------- | ------ | --------------- | -------------------------------------------------------------------- |
| `status`  | string | Yes             | `submitted` (owner, from `draft`) or `approved` / `rejected` (admin) |
| `reason`  | string | With `rejected` | Why the invoice is rejected. Trimmed; 1–500 characters               |
| `comment` | string | No              | Optional note on an approval. Trimmed; at most 500 characters        |

```jsonc
// Admin rejects (reason required)
{ "status": "rejected", "reason": "Tax should be 10% of the amount, not 8%." }

// Admin approves (comment optional)
{ "status": "approved", "comment": "Matches PO-2291." }
```

---

## 📜 Invoice Histories

| Method | Endpoint              | Auth | Description                 |
| ------ | --------------------- | ---- | --------------------------- |
| GET    | /invoices/:id/history | 🔒   | Get history log for invoice |

Append-only audit trail, oldest first. Owner or admin: `200`; other user: `403`; unknown or deleted invoice: `404`;
no token: `401`. `GET /invoices` and `GET /invoices/:id` embed the same entries in `histories`.

| Field       | Type           | Description                                                                        |
| ----------- | -------------- | ---------------------------------------------------------------------------------- |
| `eventType` | string \| null | `created`, `edited`, `submitted`, `resubmitted`, `approved`, `rejected`, `deleted` |
| `actor`     | string \| null | Email of the user who acted, as it was at that time                                |
| `reason`    | string         | Only on `rejected` events: the admin's reason                                      |
| `comment`   | string         | Only on `approved` events that were given a comment                                |
| `changes`   | object         | `{ field: { old, new } }`; `{}` when nothing changed                               |
| `createdAt` | string         | Server timestamp (ISO 8601)                                                        |
| `legacy`    | `true`         | Only on entries stored before audit tracking                                       |

- `edited` is recorded only when `PUT` changes a value on a submitted invoice.
- `submitted` is recorded when the owner submits a draft; `approved` and `rejected` when an admin decides, by `PATCH`.
- `resubmitted` is reserved for later status-workflow changes.
- Legacy entries are normalized on read and never rewritten: `actor: null`, and `eventType` is `edited` if they hold
  changes, otherwise `null` with `changes: {}`.

---

## 🧾 Invoices API V2

> Base path: `/api/v2`

V2 extends V1 with amount range filtering on the list endpoint. All other invoice endpoints remain unchanged.

| Method | Endpoint  | Auth | Description                                   |
| ------ | --------- | ---- | --------------------------------------------- |
| GET    | /invoices | 🔒   | Get list of invoices with amount range filter |

### Query Parameters

#### GET /api/v2/invoices

Includes all V1 parameters plus:

| Param     | Type   | Required | Default | Description                              |
| --------- | ------ | -------- | ------- | ---------------------------------------- |
| minAmount | number | No       | -       | Filter invoices with amount >= minAmount |
| maxAmount | number | No       | -       | Filter invoices with amount <= maxAmount |

Examples:

```http
GET /api/v2/invoices?minAmount=1000
GET /api/v2/invoices?maxAmount=5000
GET /api/v2/invoices?minAmount=1000&maxAmount=5000
GET /api/v2/invoices?minAmount=1000&status=submitted&page=1&limit=10
```

---

## 📊 Reporting

| Method | Endpoint                | Auth | Description                                               |
| ------ | ----------------------- | ---- | --------------------------------------------------------- |
| GET    | /reports/invoices       | 🔒   | Get invoice report with summary                           |
| POST   | /reports/invoices/pdf   | 🔒   | Generate and download invoice report as PDF               |
| POST   | /reports/invoices/email | 🔒   | Send invoice report via email asynchronously using BullMQ |

Authorization:

- Admins can view all invoices.
- Regular users can only view their own invoices.

---

#### Request Body

| Param          | Type   | Required | Description                                  |
| -------------- | ------ | -------- | -------------------------------------------- |
| from           | string | Yes      | Start date (YYYY-MM-DD)                      |
| to             | string | Yes      | End date (YYYY-MM-DD)                        |
| status         | string | No       | Filter by invoice status                     |
| recipientEmail | string | No       | Email to send report to (defaults to user's) |

#### Example

```http
GET /reports/invoices?from=2025-07-01&to=2026-06-03&status=submitted

POST /reports/invoices/pdf
{
  "from": "2025-07-01",
  "to": "2026-06-03",
  "status": "approved"
}

POST /reports/invoices/email
{
  "from": "2025-07-01",
  "to": "2026-06-03",
  "status": "approved",
  "recipientEmail": "manager@example.com"
}
```
