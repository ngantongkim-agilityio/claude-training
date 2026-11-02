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

| Method | Endpoint      | Auth | Description                                                                                                                                                   |
| ------ | ------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | /invoices     | 🔒   | Get list of invoices                                                                                                                                          |
| GET    | /invoices/:id | 🔒   | Get detail of 1 invoice                                                                                                                                       |
| POST   | /invoices     | 🔒   | Create a new invoice (initial status: `draft`). Records a `created` event.                                                                                    |
| PUT    | /invoices/:id | 🔒   | Update invoice (owner; draft, submitted or rejected). Changes to a submitted or rejected invoice record an `edited` event; a rejected invoice stays rejected. |
| PATCH  | /invoices/:id | 🔒   | Update invoice status (`draft → submitted`, `rejected → submitted` by the owner, `submitted → approved/rejected` by an admin).                                |
| DELETE | /invoices/:id | 🔒   | Soft delete invoice (owner; draft, submitted or rejected; `isDeleted = true`) and record a `deleted` event in the same write.                                 |

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

| Field               | Type   | Required                     | Description                                                                                                   |
| ------------------- | ------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `status`            | string | Yes                          | `submitted` (owner, from `draft` or `rejected`) or `approved` / `rejected` (admin)                            |
| `reason`            | string | With `rejected`              | Why the invoice is rejected. Trimmed; 1–500 characters                                                        |
| `comment`           | string | No                           | Optional note on an approval. Trimmed; at most 500 characters                                                 |
| `expectedUpdatedAt` | string | With `approved` / `rejected` | The `updatedAt` (ISO 8601 date-time) of the invoice version the admin reviewed. Refused with any other status |

```jsonc
// Admin rejects (reason and expectedUpdatedAt required)
{ "status": "rejected", "reason": "Tax should be 10% of the amount, not 8%.", "expectedUpdatedAt": "2026-11-02T10:00:00.000Z" }

// Admin approves (comment optional, expectedUpdatedAt required)
{ "status": "approved", "comment": "Matches PO-2291.", "expectedUpdatedAt": "2026-11-02T10:00:00.000Z" }

// Owner resubmits a rejected invoice (same invoice number; no expectedUpdatedAt)
{ "status": "submitted" }
```

Checks run in this order and the first failure wins:

| #   | Check                                                                                 | Response              |
| --- | ------------------------------------------------------------------------------------- | --------------------- |
| 1   | Body validation (including the `expectedUpdatedAt` rules above)                       | `400`                 |
| 2   | Invoice not found or deleted                                                          | `404`                 |
| 3   | Caller is neither the owner nor an admin                                              | `403 FORBIDDEN`       |
| 3   | A non-admin asks for `approved` or `rejected`                                         | `403 INVALID_STATUS`  |
| 4   | `approved` / `rejected` only: `expectedUpdatedAt` differs from the stored `updatedAt` | `409 INVOICE_CHANGED` |
| 5   | The invoice is approved (final)                                                       | `409 CANNOT_UPDATE`   |
| 6   | The transition is not allowed (see below)                                             | `403 INVALID_STATUS`  |

Allowed transitions: the owner `draft → submitted` and `rejected → submitted` (recorded as `resubmitted`); an admin
`submitted → approved` or `rejected`. Any admin may decide a resubmitted invoice, including the one who rejected it.

`409 INVOICE_CHANGED` ("This invoice has changed since you opened it. Reload it to review the latest version.") is also
returned by `PUT`, `PATCH` and `DELETE` when another request changed the invoice between the read and the write: of two
simultaneous saves one succeeds and the other gets this error. A rejected invoice that is edited, resubmitted or
deleted by anyone but its owner gets `403`; an approved invoice stays final (`409`).

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

- `edited` is recorded only when `PUT` changes a value on a submitted or rejected invoice.
- `submitted` is recorded when the owner submits a draft; `resubmitted` when the owner submits a rejected invoice;
  `approved` and `rejected` when an admin decides, by `PATCH`.
- Legacy entries are normalized on read and never rewritten: `actor: null`, and `eventType` is `edited` if they hold
  changes, otherwise `null` with `changes: {}`.

---

## 🧾 Invoices API V2

> Base path: `/api/v2`

V2 extends V1 with amount range filtering on the list endpoint. All other invoice endpoints remain unchanged and
inherit V1 behavior, including the `PATCH` rules above (`expectedUpdatedAt` is required to approve or reject).

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
