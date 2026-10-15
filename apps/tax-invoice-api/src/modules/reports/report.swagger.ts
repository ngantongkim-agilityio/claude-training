import { z } from 'zod'

import {
  OpenAPIRegistry,
  bearerAuth,
  badRequest,
  unauthorized,
  successResponse,
} from '@/configs/swagger'

import { InvoiceResponseSchema } from '@/modules/invoices/invoice.dto'

import {
  GetInvoiceReportQuerySchema,
  ExportPdfBodySchema,
  EmailReportBodySchema,
  InvoiceReportSummarySchema,
} from './report.dto'

export const registerReportSwagger = (registry: OpenAPIRegistry) => {
  registry.registerPath({
    method: 'get',
    path: '/reports/invoices',
    tags: ['Reports'],
    security: [bearerAuth],
    summary: 'Get invoice report with summary',
    request: {
      query: GetInvoiceReportQuerySchema,
    },
    responses: {
      200: {
        description: 'Invoice report fetched',
        content: {
          'application/json': {
            schema: successResponse(
              z.object({
                summary: InvoiceReportSummarySchema,
                invoices: z.array(InvoiceResponseSchema),
                pagination: z.object({
                  page: z.number(),
                  limit: z.number(),
                  total: z.number(),
                  totalPages: z.number(),
                }),
              }),
            ),
          },
        },
      },
      400: badRequest(),
      401: unauthorized(),
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/reports/invoices/pdf',
    tags: ['Reports'],
    security: [bearerAuth],
    summary: 'Generate and download invoice report as PDF',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ExportPdfBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'PDF file download',
        content: {
          'application/pdf': {
            schema: z.string().openapi({ format: 'binary' }),
          },
        },
      },
      400: badRequest(),
      401: unauthorized(),
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/reports/invoices/email',
    tags: ['Reports'],
    security: [bearerAuth],
    summary: 'Send invoice report via email asynchronously using BullMQ',
    request: {
      body: {
        content: {
          'application/json': {
            schema: EmailReportBodySchema,
          },
        },
      },
    },
    responses: {
      202: {
        description: 'Report email queued',
        content: {
          'application/json': {
            schema: successResponse(
              z.object({
                jobId: z.string(),
              }),
            ),
          },
        },
      },
      400: badRequest(),
      401: unauthorized(),
    },
  })
}
