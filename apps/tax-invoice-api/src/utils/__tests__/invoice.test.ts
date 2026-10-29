import { toInvoiceHistoryResponse } from '../invoice'

// Types
import { InvoiceEventType, InvoiceHistory } from '@/types'

describe('toInvoiceHistoryResponse', () => {
  const createdAt = new Date('2026-11-03T02:10:00.000Z')
  const amountChange = { amount: { old: 1000, new: 1200 } }

  it('should map a recorded event with its actor and an ISO timestamp', () => {
    const result = toInvoiceHistoryResponse({
      eventType: InvoiceEventType.EDITED,
      actor: 'lan@example.com',
      changes: amountChange,
      createdAt,
    })

    expect(result).toEqual({
      eventType: InvoiceEventType.EDITED,
      actor: 'lan@example.com',
      changes: amountChange,
      createdAt: '2026-11-03T02:10:00.000Z',
    })
  })

  it('should return changes as {} on events without field changes', () => {
    const result = toInvoiceHistoryResponse({
      eventType: InvoiceEventType.CREATED,
      actor: 'lan@example.com',
      createdAt,
    })

    expect(result.changes).toEqual({})
    expect(result).not.toHaveProperty('legacy')
  })

  it.each([
    ['missing', {}],
    ['null', { eventType: null }],
  ])(
    'should read a legacy entry with changes and eventType %s as a legacy edit',
    (_label, typeField) => {
      const result = toInvoiceHistoryResponse({
        ...typeField,
        changes: amountChange,
        createdAt,
      } as InvoiceHistory)

      expect(result).toEqual({
        eventType: InvoiceEventType.EDITED,
        actor: null,
        changes: amountChange,
        createdAt: '2026-11-03T02:10:00.000Z',
        legacy: true,
      })
    },
  )

  it.each([
    ['missing', {}],
    ['null', { changes: null }],
    ['empty', { changes: {} }],
  ])(
    'should read a legacy entry with changes %s as an untyped legacy entry',
    (_label, changesField) => {
      const result = toInvoiceHistoryResponse({
        ...changesField,
        createdAt,
      } as InvoiceHistory)

      expect(result).toEqual({
        eventType: null,
        actor: null,
        changes: {},
        createdAt: '2026-11-03T02:10:00.000Z',
        legacy: true,
      })
    },
  )

  it('should drop stored fields outside the response shape', () => {
    const result = toInvoiceHistoryResponse({
      _id: 'subdocument-id',
      eventType: InvoiceEventType.DELETED,
      actor: 'lan@example.com',
      createdAt,
    } as InvoiceHistory)

    expect(result).not.toHaveProperty('_id')
  })
})
