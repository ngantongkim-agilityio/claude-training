import { z } from 'zod'
import { DateTime } from 'luxon'

// Constants
import { ERROR_MESSAGE } from '@/constants'

// Strict YYYY-MM-DD shape (zero-padded); single-digit month/day is rejected.
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/

// The date must actually exist on the calendar (e.g. 2026-02-30 is rejected).
// Luxon strict ISO parsing handles month lengths and leap years.
const isCalendarDate = (value: string): boolean =>
  DATE_FORMAT_REGEX.test(value) &&
  DateTime.fromISO(value, { zone: 'utc' }).isValid

const dateRangeFields = (fromName: string, toName: string) => ({
  // Empty strings fail `.min(1)` first; the refine is vacuous on '' so the
  // field reports only the required-field error, not an invalid-date error.
  from: z
    .string()
    .min(1, ERROR_MESSAGE.IS_REQUIRED(fromName))
    .refine(
      (value) => value.length === 0 || isCalendarDate(value),
      ERROR_MESSAGE.IS_INVALID(fromName),
    ),
  to: z
    .string()
    .min(1, ERROR_MESSAGE.IS_REQUIRED(toName))
    .refine(
      (value) => value.length === 0 || isCalendarDate(value),
      ERROR_MESSAGE.IS_INVALID(toName),
    ),
})

// from <= to compares lexicographically, which is chronological for
// zero-padded YYYY-MM-DD strings — no date parsing needed.
const checkDateOrder = (
  data: { from: string; to: string },
  ctx: z.RefinementCtx,
): void => {
  // Only compare when both dates are valid; otherwise the field-level
  // errors already describe the problem (and `parseRequest` keeps only
  // the last issue per field, so an extra ordering issue would hide them).
  if (!isCalendarDate(data.from) || !isCalendarDate(data.to)) return
  if (data.from > data.to) {
    ctx.addIssue({
      code: 'custom',
      message: ERROR_MESSAGE.INVALID_DATE_RANGE,
      path: ['from'],
    })
  }
}

export const GetInvoiceReportQuerySchema = z
  .object({
    ...dateRangeFields('From date', 'To date'),
    status: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  })
  .superRefine(checkDateOrder)

export type GetInvoiceReportQueryDTO = z.infer<
  typeof GetInvoiceReportQuerySchema
>

export const ExportPdfBodySchema = z
  .object({
    ...dateRangeFields('From date', 'To date'),
    status: z.string().optional(),
  })
  .superRefine(checkDateOrder)

export type ExportPdfBodyDTO = z.infer<typeof ExportPdfBodySchema>

export const EmailReportBodySchema = z
  .object({
    ...dateRangeFields('From date', 'To date'),
    status: z.string().optional(),
    recipientEmail: z.string().email().optional(),
  })
  .superRefine(checkDateOrder)

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
