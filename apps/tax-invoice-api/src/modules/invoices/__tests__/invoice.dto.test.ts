import {
  CreateInvoiceSchema,
  GetInvoicesQuerySchema,
  GetInvoicesV2QuerySchema,
  InvoiceHistorySchema,
  UpdateInvoiceSchema,
  UpdateInvoiceStatusSchema,
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

  it('keeps the reason or comment of a decision entry', () => {
    const rejected = {
      eventType: 'rejected',
      actor: 'admin@example.com',
      reason: 'Tax should be 10%',
      changes: {},
    }
    const approved = {
      eventType: 'approved',
      actor: 'admin@example.com',
      comment: 'Matches PO-2291',
      changes: {},
    }

    expect(InvoiceHistorySchema.parse(rejected)).toEqual(rejected)
    expect(InvoiceHistorySchema.parse(approved)).toEqual(approved)
  })
})

describe('UpdateInvoiceStatusSchema', () => {
  // Returns the per-field messages the way parseRequest builds them (last issue per field wins)
  const fieldErrors = (body: unknown) => {
    const result = UpdateInvoiceStatusSchema.safeParse(body)
    if (result.success) return {}
    return Object.fromEntries(
      result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
    )
  }

  it('trims the reason of a rejection (TC-16)', () => {
    const result = UpdateInvoiceStatusSchema.parse({
      status: 'rejected',
      reason: '  Tax should be 10%  ',
    })

    expect(result).toEqual({ status: 'rejected', reason: 'Tax should be 10%' })
  })

  it.each([
    ['missing', {}],
    ['empty', { reason: '' }],
    ['only spaces (TC-18)', { reason: '   ' }],
  ])('requires a reason to reject when it is %s', (_label, body) => {
    expect(fieldErrors({ status: 'rejected', ...body })).toEqual({
      reason: 'Reason is required',
    })
  })

  it('accepts a 500-character reason and rejects 501 after trimming (TC-19)', () => {
    const at500 = ` ${'a'.repeat(500)} `
    const at501 = 'a'.repeat(501)

    expect(fieldErrors({ status: 'rejected', reason: at500 })).toEqual({})
    expect(fieldErrors({ status: 'rejected', reason: at501 })).toEqual({
      reason: 'Reason must be at most 500 characters',
    })
  })

  it('trims an approval comment and allows approving without one', () => {
    expect(
      UpdateInvoiceStatusSchema.parse({
        status: 'approved',
        comment: ' Matches PO-2291 ',
      }),
    ).toEqual({ status: 'approved', comment: 'Matches PO-2291' })
    expect(fieldErrors({ status: 'approved' })).toEqual({})
    expect(fieldErrors({ status: 'approved', comment: '   ' })).toEqual({})
  })

  it('accepts a 500-character comment and rejects 501 after trimming', () => {
    expect(
      fieldErrors({ status: 'approved', comment: 'c'.repeat(500) }),
    ).toEqual({})
    expect(
      fieldErrors({ status: 'approved', comment: 'c'.repeat(501) }),
    ).toEqual({ comment: 'Comment must be at most 500 characters' })
  })

  it.each(['approved', 'submitted', 'draft'])(
    'rejects a reason sent with status %s (TC-23)',
    (status) => {
      expect(fieldErrors({ status, reason: 'Tax is wrong' })).toEqual({
        reason: 'Reason is only allowed when status is rejected',
      })
    },
  )

  it.each(['rejected', 'submitted', 'draft'])(
    'rejects a comment sent with status %s',
    (status) => {
      expect(
        fieldErrors({
          status,
          comment: 'Looks good',
          ...(status === 'rejected' && { reason: 'Tax is wrong' }),
        }),
      ).toEqual({
        comment: 'Comment is only allowed when status is approved',
      })
    },
  )

  it('treats a blank reason or comment sent with another status as absent', () => {
    expect(
      fieldErrors({ status: 'submitted', reason: '  ', comment: '' }),
    ).toEqual({})
  })

  it('reports one message for each field when both are wrong', () => {
    expect(
      fieldErrors({
        status: 'approved',
        reason: 'Tax is wrong',
        comment: 'c'.repeat(501),
      }),
    ).toEqual({
      reason: 'Reason is only allowed when status is rejected',
      comment: 'Comment must be at most 500 characters',
    })
    expect(fieldErrors({ status: 'rejected', comment: 'Looks good' })).toEqual({
      reason: 'Reason is required',
      comment: 'Comment is only allowed when status is approved',
    })
  })

  it.each([
    ['a number', 5],
    ['null', null],
  ])('rejects a reason or comment that is %s', (_label, value) => {
    expect(fieldErrors({ status: 'rejected', reason: value })).toEqual({
      reason: 'Reason is invalid',
    })
    expect(fieldErrors({ status: 'approved', comment: value })).toEqual({
      comment: 'Comment is invalid',
    })
  })
})
