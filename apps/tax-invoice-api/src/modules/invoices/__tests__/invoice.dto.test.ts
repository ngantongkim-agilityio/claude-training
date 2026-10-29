import {
  CreateInvoiceSchema,
  GetInvoicesQuerySchema,
  GetInvoicesV2QuerySchema,
  InvoiceHistorySchema,
  UpdateInvoiceSchema,
} from '../invoice.dto'

const schemas = {
  GetInvoicesQuerySchema,
  GetInvoicesV2QuerySchema,
} as const

describe.each(Object.entries(schemas))(
  '%s sortBy validation',
  (_name, schema) => {
    it.each(['amount', 'createdAt', 'updatedAt'])(
      'accepts sortBy=%s',
      (sortBy) => {
        const result = schema.safeParse({ sortBy })

        expect(result.success).toBe(true)
      },
    )

    // sortBy becomes a Mongo sort key, so anything outside the allow-list must be rejected
    it.each(['user', 'isDeleted', '$natural'])(
      'rejects sortBy=%s',
      (sortBy) => {
        const result = schema.safeParse({ sortBy })

        expect(result.success).toBe(false)
      },
    )
  },
)

// History is append-only, so a client-sent histories array must never reach the service
describe.each(Object.entries({ CreateInvoiceSchema, UpdateInvoiceSchema }))(
  '%s histories in the body',
  (_name, schema) => {
    it('drops a histories key', () => {
      const result = schema.parse({
        amount: 100,
        histories: [{ eventType: 'approved', changes: {} }],
      })

      expect(result).toEqual({ amount: 100 })
    })
  },
)

describe('InvoiceHistorySchema', () => {
  it('keeps the event fields of a recorded entry', () => {
    const entry = {
      eventType: 'created',
      actor: 'lan@example.com',
      changes: {},
      createdAt: '2026-11-03T02:10:00.000Z',
    }

    expect(InvoiceHistorySchema.parse(entry)).toEqual(entry)
  })

  it('accepts a legacy entry with a null eventType and actor', () => {
    const entry = { eventType: null, actor: null, changes: {}, legacy: true }

    expect(InvoiceHistorySchema.parse(entry)).toEqual(entry)
  })
})
