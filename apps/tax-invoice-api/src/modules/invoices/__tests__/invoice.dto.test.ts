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
  // A decision names the version the admin reviewed (KAN-6)
  const reviewed = { expectedUpdatedAt: '2026-11-02T10:00:00.000Z' }

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
      ...reviewed,
    })

    expect(result).toEqual({
      status: 'rejected',
      reason: 'Tax should be 10%',
      ...reviewed,
    })
  })

  it.each([
    ['missing', {}],
    ['empty', { reason: '' }],
    ['only spaces (TC-18)', { reason: '   ' }],
  ])('requires a reason to reject when it is %s', (_label, body) => {
    expect(fieldErrors({ status: 'rejected', ...reviewed, ...body })).toEqual({
      reason: 'Reason is required',
    })
  })

  it('accepts a 500-character reason and rejects 501 after trimming (TC-19)', () => {
    const at500 = ` ${'a'.repeat(500)} `
    const at501 = 'a'.repeat(501)

    expect(
      fieldErrors({ status: 'rejected', reason: at500, ...reviewed }),
    ).toEqual({})
    expect(
      fieldErrors({ status: 'rejected', reason: at501, ...reviewed }),
    ).toEqual({
      reason: 'Reason must be at most 500 characters',
    })
  })

  it('trims an approval comment and allows approving without one', () => {
    expect(
      UpdateInvoiceStatusSchema.parse({
        status: 'approved',
        comment: ' Matches PO-2291 ',
        ...reviewed,
      }),
    ).toEqual({ status: 'approved', comment: 'Matches PO-2291', ...reviewed })
    expect(fieldErrors({ status: 'approved', ...reviewed })).toEqual({})
    expect(
      fieldErrors({ status: 'approved', comment: '   ', ...reviewed }),
    ).toEqual({})
  })

  it('accepts a 500-character comment and rejects 501 after trimming', () => {
    expect(
      fieldErrors({
        status: 'approved',
        comment: 'c'.repeat(500),
        ...reviewed,
      }),
    ).toEqual({})
    expect(
      fieldErrors({
        status: 'approved',
        comment: 'c'.repeat(501),
        ...reviewed,
      }),
    ).toEqual({ comment: 'Comment must be at most 500 characters' })
  })

  it.each(['approved', 'submitted', 'draft'])(
    'rejects a reason sent with status %s (TC-23)',
    (status) => {
      expect(
        fieldErrors({
          status,
          reason: 'Tax is wrong',
          ...(status === 'approved' && reviewed),
        }),
      ).toEqual({
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
          ...(status === 'rejected' && { reason: 'Tax is wrong', ...reviewed }),
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
        ...reviewed,
      }),
    ).toEqual({
      reason: 'Reason is only allowed when status is rejected',
      comment: 'Comment must be at most 500 characters',
    })
    expect(
      fieldErrors({ status: 'rejected', comment: 'Looks good', ...reviewed }),
    ).toEqual({
      reason: 'Reason is required',
      comment: 'Comment is only allowed when status is approved',
    })
  })

  it.each([
    ['a number', 5],
    ['null', null],
  ])('rejects a reason or comment that is %s', (_label, value) => {
    expect(
      fieldErrors({ status: 'rejected', reason: value, ...reviewed }),
    ).toEqual({
      reason: 'Reason is invalid',
    })
    expect(
      fieldErrors({ status: 'approved', comment: value, ...reviewed }),
    ).toEqual({
      comment: 'Comment is invalid',
    })
  })
  // KAN-6: an admin's decision must name the version they reviewed
  describe('expectedUpdatedAt', () => {
    const stamp = '2026-11-02T10:00:00.000Z'

    it.each(['approved', 'rejected'])(
      'requires expectedUpdatedAt when status is %s (TC-64)',
      (status) => {
        expect(
          fieldErrors({
            status,
            ...(status === 'rejected' && { reason: 'Tax is wrong' }),
          }),
        ).toEqual({ expectedUpdatedAt: 'Expected updated at is required' })
      },
    )

    it.each(['approved', 'rejected'])(
      'rejects a value that is not an ISO date-time for status %s (TC-64)',
      (status) => {
        expect(
          fieldErrors({
            status,
            expectedUpdatedAt: 'yesterday',
            ...(status === 'rejected' && { reason: 'Tax is wrong' }),
          }),
        ).toEqual({ expectedUpdatedAt: 'Expected updated at is invalid' })
      },
    )

    it.each(['submitted', 'draft'])(
      'rejects expectedUpdatedAt sent with status %s (TC-64)',
      (status) => {
        expect(fieldErrors({ status, expectedUpdatedAt: stamp })).toEqual({
          expectedUpdatedAt:
            'Expected updated at is only allowed when status is approved or rejected',
        })
      },
    )

    it('accepts an ISO date-time with a decision and keeps it (TC-64)', () => {
      expect(
        UpdateInvoiceStatusSchema.parse({
          status: 'approved',
          expectedUpdatedAt: stamp,
        }),
      ).toEqual({ status: 'approved', expectedUpdatedAt: stamp })
    })

    it('accepts an ISO date-time with a UTC offset (TC-64)', () => {
      expect(
        UpdateInvoiceStatusSchema.safeParse({
          status: 'approved',
          expectedUpdatedAt: '2026-11-02T17:00:00.000+07:00',
        }).success,
      ).toBe(true)
    })
  })
})

// Negative amounts stay a validation error when a rejected invoice is edited (T3 rules)
describe('UpdateInvoiceSchema amount', () => {
  it('rejects a negative amount (TC-37)', () => {
    expect(UpdateInvoiceSchema.safeParse({ amount: -5 }).success).toBe(false)
  })
})
