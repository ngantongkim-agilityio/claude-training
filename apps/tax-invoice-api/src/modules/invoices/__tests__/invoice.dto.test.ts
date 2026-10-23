import {
  GetInvoicesQuerySchema,
  GetInvoicesV2QuerySchema,
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
