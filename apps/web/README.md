# Tax Invoice Management Dashboard

A modern web application for managing tax invoices, built with Next.js 16, React 19, and TypeScript. Supports both Local Authentication and Auth0 Authentication.

---

## Features

### Authentication

- Local authentication (email and password registration and login)
- Auth0 authentication (Google OAuth)
- Unified token resolution across both auth methods
- Protected dashboard routes with server-side session checks

### Invoice Management

- Create invoices (regular users only)
- Update invoices in draft or submitted status
- Soft delete invoices with confirmation dialog
- Submit invoices for approval (user role)
- Approve or reject submitted invoices (admin role)
- Invoice detail view with status-aware action controls

### Search and Filtering

- Debounced search by invoice number
- Filter by status
- Filter by date range
- Sortable columns (created date, ascending/descending)
- Pagination

### User Management

- Admin-only user listing with email search
- Paginated user directory (admin role)

### Reporting

- Invoice report generation with date range filtering
- Status-based filtering
- PDF export with automatic file download
- Email report delivery via send email dialog
- Asynchronous email processing via BullMQ (backend)
- Redis-backed queue worker (backend)
- Role-based report scope (admins see all invoices, users see only their own)

---

## Tech Stack

| Category       | Technology                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Framework      | [Next.js 16](https://nextjs.org) (App Router)                                                                  |
| Language       | [TypeScript](https://www.typescriptlang.org)                                                                   |
| UI             | [Tailwind CSS v4](https://tailwindcss.com), [Shadcn/UI](https://ui.shadcn.com), [Base UI](https://base-ui.com) |
| Icons          | [Lucide Icons](https://lucide.dev)                                                                             |
| Server State   | [TanStack Query](https://tanstack.com/query)                                                                   |
| Client State   | [Zustand](https://zustand.docs.pmnd.rs)                                                                        |
| Forms          | [React Hook Form](https://react-hook-form.com)                                                                 |
| Validation     | [Zod](https://zod.dev)                                                                                         |
| Authentication | [Auth0](https://auth0.com)                                                                                     |

---

## Prerequisites

- [Node.js v22.16.0](https://nodejs.org/en/download/package-manager)
- [pnpm v10.12.4](https://pnpm.io/installation)

---

## Getting Started

Clone the repository and checkout the branch:

```bash
git clone git@gitlab.asoft-python.com:ngan.tongkim/nodejs-training.git
git checkout feat/practice-one
cd practice-one/web
```

Install dependencies:

```bash
pnpm install
```

Create environment file:

```bash
cp .env.example .env.local
```

Start the development server:

```bash
pnpm dev
```

The application runs at `http://localhost:3001`.

---

## Scripts

| Command      | Description                  |
| ------------ | ---------------------------- |
| `pnpm dev`   | Start development server     |
| `pnpm build` | Build production application |
| `pnpm start` | Start production server      |
| `pnpm lint`  | Run ESLint                   |
| `pnpm test`  | Run tests                    |

---

## Project Structure

```
src/
├── app/            # Next.js App Router pages and layouts
├── components/     # Shared UI components
├── features/       # Feature-based modules
│   ├── auth/
│   ├── users/
│   ├── invoices/
│   └── reports/
├── hooks/          # Custom React hooks
├── lib/            # Application setup (auth, query client)
├── proxy.ts        # API proxy configuration
├── services/       # API client and service modules
├── store/          # Zustand stores
├── types/          # Shared TypeScript types
└── utils/          # Utility functions (cn, formatters)
```
