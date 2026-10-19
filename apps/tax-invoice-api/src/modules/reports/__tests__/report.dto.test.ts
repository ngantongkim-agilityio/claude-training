import { ERROR_MESSAGE } from '@/constants'
import {
  EmailReportBodySchema,
  ExportPdfBodySchema,
  GetInvoiceReportQuerySchema,
} from '../report.dto'

const schemas = {
  GetInvoiceReportQuerySchema,
  ExportPdfBodySchema,
  EmailReportBodySchema,
} as const

describe.each(Object.entries(schemas))('%s date range validation', (_name, schema) => {
  it('accepts a valid range', () => {
    const result = schema.safeParse({ from: '2026-06-01', to: '2026-06-30' })

    expect(result.success).toBe(true)
  })

  it('accepts a single-day range', () => {
    const result = schema.safeParse({ from: '2026-06-11', to: '2026-06-11' })

    expect(result.success).toBe(true)
  })

  it('rejects a bad from format', () => {
    const result = schema.safeParse({ from: 'not-a-date', to: '2026-06-30' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        ERROR_MESSAGE.IS_INVALID('From date'),
      )
    }
  })

  it('rejects a bad to format', () => {
    const result = schema.safeParse({ from: '2026-06-01', to: '06/30/2026' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        ERROR_MESSAGE.IS_INVALID('To date'),
      )
    }
  })

  it('rejects a non-existent from date (2026-02-30)', () => {
    const result = schema.safeParse({ from: '2026-02-30', to: '2026-06-30' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        ERROR_MESSAGE.IS_INVALID('From date'),
      )
    }
  })

  it('rejects a non-existent to date (2026-02-30)', () => {
    const result = schema.safeParse({ from: '2026-06-01', to: '2026-02-30' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        ERROR_MESSAGE.IS_INVALID('To date'),
      )
    }
  })

  it('rejects from later than to', () => {
    const result = schema.safeParse({ from: '2026-07-01', to: '2026-06-01' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          message: ERROR_MESSAGE.INVALID_DATE_RANGE,
          path: ['from'],
        }),
      )
    }
  })

  it('rejects single-digit month/day (2026-6-1)', () => {
    const result = schema.safeParse({ from: '2026-6-1', to: '2026-06-30' })

    expect(result.success).toBe(false)
  })

  it('reports only the required-field error for empty values', () => {
    const result = schema.safeParse({ from: '', to: '' })

    expect(result.success).toBe(false)
    if (!result.success) {
      // Each field must produce exactly one issue — the required-field error.
      // Mirrors `parseRequest`, which maps issues by field path.
      const byPath = Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join('.'),
          issue.message,
        ]),
      )
      expect(byPath).toEqual({
        from: ERROR_MESSAGE.IS_REQUIRED('From date'),
        to: ERROR_MESSAGE.IS_REQUIRED('To date'),
      })
    }
  })
})
