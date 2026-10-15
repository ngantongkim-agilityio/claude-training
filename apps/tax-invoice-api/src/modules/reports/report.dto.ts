import { z } from 'zod'

// Constants
import { ERROR_MESSAGE } from '@/constants'

export const GetInvoiceReportQuerySchema = z.object({
  from: z.string().min(1, ERROR_MESSAGE.IS_REQUIRED('From date')),
  to: z.string().min(1, ERROR_MESSAGE.IS_REQUIRED('To date')),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

export type GetInvoiceReportQueryDTO = z.infer<
  typeof GetInvoiceReportQuerySchema
>

export const ExportPdfBodySchema = z.object({
  from: z.string().min(1, ERROR_MESSAGE.IS_REQUIRED('From date')),
  to: z.string().min(1, ERROR_MESSAGE.IS_REQUIRED('To date')),
  status: z.string().optional(),
})

export type ExportPdfBodyDTO = z.infer<typeof ExportPdfBodySchema>

export const EmailReportBodySchema = z.object({
  from: z.string().min(1, ERROR_MESSAGE.IS_REQUIRED('From date')),
  to: z.string().min(1, ERROR_MESSAGE.IS_REQUIRED('To date')),
  status: z.string().optional(),
  recipientEmail: z.string().email().optional(),
})

export type EmailReportBodyDTO = z.infer<typeof EmailReportBodySchema>

export const InvoiceReportSummarySchema = z.object({
  totalInvoices: z.number(),
  totalAmount: z.number(),
  totalTax: z.number(),
  draftCount: z.number(),
  submittedCount: z.number(),
  approvedCount: z.number(),
  rejectedCount: z.number(),
})

export type InvoiceReportSummary = z.infer<typeof InvoiceReportSummarySchema>
