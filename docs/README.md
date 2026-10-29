# Docs

Project-level planning documents. The API and data contracts are not here: they stay in
`apps/tax-invoice-api/docs/` (`APIs_DESIGN.md` is the source of truth for every endpoint).

| Path                        | Holds                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `features/<slug>/intent.md` | One per feature: what is wanted, why, constraints, and links to its supporting spec and Jira issues. |
| `tickets/`                  | One short record per Jira issue. Format and rules: [tickets/README.md](tickets/README.md).           |

## Sources of truth

| What                                                         | Where                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Requirements, acceptance criteria, dependencies and status   | The Jira issue in project KAN                                           |
| Supporting detail (refined criteria, test matrix, decisions) | The spec the Jira issue links; never overrides Jira                     |
| API contract                                                 | `apps/tax-invoice-api/docs/APIs_DESIGN.md`, updated in each ticket's PR |

Requirements change only through a visible, approved Jira edit. A difference between the spec and Jira is raised as a
comment on the Jira issue. Fake data only, in every document and ticket.

## Features

| Feature                                                                 | Jira                                          | Status                           |
| ----------------------------------------------------------------------- | --------------------------------------------- | -------------------------------- |
| [invoice-rejection-rework](features/invoice-rejection-rework/intent.md) | KAN-4 to KAN-8 ([records](tickets/README.md)) | Spec approved; build not started |
