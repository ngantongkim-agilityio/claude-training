import { z } from 'zod'

import {
  OpenAPIRegistry,
  bearerAuth,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  successResponse,
} from '@/configs/swagger'

import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  UpdateInvoiceStatusSchema,
  InvoiceParamsSchema,
  GetInvoicesQuerySchema,
  InvoiceResponseSchema,
  CreateInvoiceResponseSchema,
  UpdateInvoiceStatusResponseSchema,
  UpdateInvoiceInfoResponseSchema,
  DeleteInvoiceResponseSchema,
  GetInvoiceHistoryResponseSchema,
  GetInvoicesResponseSchema,
} from './invoice.dto'

export const registerInvoiceSwagger = (registry: OpenAPIRegistry) => {
  registry.registerPath({
    method: 'post',
    path: '/invoices',
    tags: ['Invoices'],
    security: [bearerAuth],
    summary: 'Create invoice',
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: CreateInvoiceSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Invoice created',
        content: {
          'application/json': {
            schema: successResponse(CreateInvoiceResponseSchema),
          },
        },
      },
      400: badRequest(),
      401: unauthorized(),
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/invoices',
    tags: ['Invoices'],
    security: [bearerAuth],
    summary: 'Get invoices',
    request: {
      query: GetInvoicesQuerySchema,
    },
    responses: {
      200: {
        description: 'Invoices fetched',
        content: {
          'application/json': {
            schema: successResponse(GetInvoicesResponseSchema),
          },
        },
      },
      401: unauthorized(),
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/invoices/{invoiceNumber}',
    tags: ['Invoices'],
    security: [bearerAuth],
    summary: 'Get invoice detail',
    request: {
      params: InvoiceParamsSchema,
    },
    responses: {
      200: {
        description: 'Invoice detail',
        content: {
          'application/json': {
            schema: successResponse(
              z.object({
                invoice: InvoiceResponseSchema,
              }),
            ),
          },
        },
      },
      401: unauthorized(),
      404: notFound(),
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/invoices/{invoiceNumber}',
    tags: ['Invoices'],
    security: [bearerAuth],
    summary: 'Update invoice status',
    description:
      'The new status and its `submitted`, `resubmitted`, `approved` or `rejected` history event are saved in one atomic write. ' +
      'The owner may also move a rejected invoice to `submitted` (recorded as `resubmitted`). ' +
      'Checks run in this order and the first failure wins: body validation (400), not found (404), neither owner nor admin (403), ' +
      'non-admin asking for approved or rejected (403 INVALID_STATUS), stale `expectedUpdatedAt` on approve or reject (409 INVOICE_CHANGED), ' +
      'approved invoice (409 CANNOT_UPDATE), transition not allowed (403 INVALID_STATUS).',
    request: {
      params: InvoiceParamsSchema,
      body: {
        required: true,
        content: {
          'application/json': {
            schema: UpdateInvoiceStatusSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Status updated',
        content: {
          'application/json': {
            schema: successResponse(UpdateInvoiceStatusResponseSchema),
          },
        },
      },
      // Field rules live on the body schema; this lists what the client sees when they fail
      400: {
        ...badRequest(),
        description:
          'Invalid body. Checked before any 403, 404 or 409. A value of only spaces counts as absent, and ' +
          'length is the JavaScript string length, so some emoji count as 2. At most one message per field ' +
          'in `errors`: "Reason is required", "Reason must be at most 500 characters", ' +
          '"Reason is only allowed when status is rejected", "Comment is only allowed when status is approved", ' +
          '"Comment must be at most 500 characters", "Reason is invalid", "Comment is invalid", ' +
          '"Expected updated at is required", "Expected updated at is invalid", ' +
          '"Expected updated at is only allowed when status is approved or rejected".',
      },
      401: unauthorized(),
      403: forbidden(),
      404: notFound(),
      409: {
        ...conflict(),
        description:
          'INVOICE_CHANGED: `expectedUpdatedAt` is stale, or another request changed or deleted the invoice ' +
          'after it was read. CANNOT_UPDATE: the invoice is approved (final).',
      },
    },
  })

  registry.registerPath({
    method: 'put',
    path: '/invoices/{invoiceNumber}',
    tags: ['Invoices'],
    security: [bearerAuth],
    summary: 'Update invoice information',
    request: {
      params: InvoiceParamsSchema,
      body: {
        required: true,
        content: {
          'application/json': {
            schema: UpdateInvoiceSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Invoice updated',
        content: {
          'application/json': {
            schema: successResponse(UpdateInvoiceInfoResponseSchema),
          },
        },
      },
      400: badRequest(),
      401: unauthorized(),
      404: notFound(),
      409: {
        ...conflict(),
        description:
          'INVOICE_CHANGED: another request changed the invoice after it was read. ' +
          'CANNOT_UPDATE / CANNOT_DELETE: the invoice is approved (final).',
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/invoices/{invoiceNumber}',
    tags: ['Invoices'],
    security: [bearerAuth],
    summary: 'Delete invoice',
    request: {
      params: InvoiceParamsSchema,
    },
    responses: {
      200: {
        description: 'Invoice deleted',
        content: {
          'application/json': {
            schema: successResponse(DeleteInvoiceResponseSchema),
          },
        },
      },
      401: unauthorized(),
      404: notFound(),
      409: {
        ...conflict(),
        description:
          'INVOICE_CHANGED: another request changed the invoice after it was read. ' +
          'CANNOT_UPDATE / CANNOT_DELETE: the invoice is approved (final).',
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/invoices/{invoiceNumber}/history',
    tags: ['Invoices'],
    security: [bearerAuth],
    summary: 'Get invoice history (oldest first)',
    request: {
      params: InvoiceParamsSchema,
    },
    responses: {
      200: {
        description: 'Invoice audit events, oldest first',
        content: {
          'application/json': {
            schema: successResponse(GetInvoiceHistoryResponseSchema),
          },
        },
      },
      401: unauthorized(),
      403: forbidden(),
      404: notFound(),
    },
  })
}
