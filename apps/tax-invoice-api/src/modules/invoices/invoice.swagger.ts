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
      400: badRequest(),
      401: unauthorized(),
      404: notFound(),
      409: conflict(),
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
      409: conflict(),
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
      409: conflict(),
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
