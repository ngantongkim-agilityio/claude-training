# Tax Invoice Management API

A RESTful API for managing user information and electronic tax invoices, built with Node.js, Express, TypeScript, and MongoDB.

---

## Features

- User authentication (Local JWT and Auth0)
- User management with role-based access control
- Invoice CRUD operations with status workflow
- Invoice approval and rejection flow
- Invoice history tracking
- Reporting and filtering
- Email notifications with PDF attachments
- Request validation with Zod

---

## Tech Stack

| Category       | Technology                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| Runtime        | [Node.js](https://nodejs.org) v22.16.0                                                                               |
| Framework      | [Express.js](https://expressjs.com)                                                                                  |
| Language       | [TypeScript](https://www.typescriptlang.org)                                                                         |
| Database       | [MongoDB](https://www.mongodb.com)                                                                                   |
| ODM            | [Mongoose](https://mongoosejs.com)                                                                                   |
| Authentication | [JWT](https://jwt.io) / [Auth0](https://auth0.com)                                                                   |
| Validation     | [Zod](https://zod.dev)                                                                                               |
| Testing        | [Jest](https://jestjs.io)                                                                                            |
| Code Quality   | [Prettier](https://prettier.io), [Husky](https://github.com/typicode/husky), [Commitlint](https://commitlint.js.org) |

---

## Prerequisites

- [Node.js v22.16.0](https://nodejs.org/en/download/package-manager)
- [pnpm v10.12.4](https://pnpm.io/installation)
- MongoDB instance (local or cloud)

---

## Getting Started

Clone the repository and checkout the branch:

```bash
git clone git@gitlab.asoft-python.com:ngan.tongkim/nodejs-training.git
git checkout feat/practice-one
cd practice-one/api
```

Install dependencies:

```bash
pnpm install
```

Create environment file:

```bash
cp .env.example .env
```

Start the development server:

```bash
pnpm run dev
```

Start the email worker (for background email processing):

```bash
pnpm run dev:worker
```

---

## Scripts

| Command               | Description                                |
| --------------------- | ------------------------------------------ |
| `pnpm run dev`        | Start the API server in development mode   |
| `pnpm run dev:worker` | Start the email worker in development mode |
| `pnpm run build`      | Build for production                       |
| `pnpm run start`      | Start the production server                |
| `pnpm run test`       | Run tests                                  |
| `pnpm run lint`       | Run linter                                 |

---

## Project Structure

```
src/
├── configs/        # Application configuration
├── constants/      # Shared constants
├── middlewares/    # Authentication and validation middleware
├── models/         # Mongoose schemas and models
├── modules/        # Feature modules
│   ├── auth/       # Authentication (controller, service, DTOs, tests)
│   ├── invoices/   # Invoice management (controller, service, DTOs, tests)
│   ├── reports/    # Reporting (controller, service, PDF, queue, tests)
│   └── users/      # User management (controller, service, DTOs, tests)
├── routes/         # Express route definitions (v1, v2)
├── schemas/        # Shared Zod validation schemas
├── types/          # Shared TypeScript types
├── utils/          # Utility functions
└── workers/        # Background job processors (email worker)
```

---

## API Documentation

Refer to `API_DESIGN.md` for the complete API contract documentation including all endpoints, request/response schemas, and authentication requirements.
