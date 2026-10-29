// Models
import { InvoiceModel } from '../invoice'

// Types
import { InvoiceEventType, InvoiceStatus } from '@/types'

describe('InvoiceModel histories', () => {
  const buildInvoice = (histories: unknown[]) =>
    new InvoiceModel({
      invoiceNumber: 'INV-1234567890000-1234',
      user: 'owner@example.com',
      status: InvoiceStatus.SUBMITTED,
      amount: 1000,
      histories,
    })

  it('should accept legacy entries without an eventType next to a new edited event', () => {
    const invoice = buildInvoice([
      { changes: { amount: { old: 900, new: 1000 } } },
      { eventType: null, changes: {} },
      {
        eventType: InvoiceEventType.EDITED,
        actor: 'owner@example.com',
        changes: { tax: { old: 80, new: 100 } },
      },
    ])

    expect(invoice.validateSync()).toBeUndefined()
    expect(invoice.histories?.[2].eventType).toBe(InvoiceEventType.EDITED)
    expect(invoice.histories?.[2].actor).toBe('owner@example.com')
  })

  it('should reject an unknown eventType', () => {
    const invoice = buildInvoice([{ eventType: 'renamed', changes: {} }])

    const error = invoice.validateSync()

    expect(error?.errors['histories.0.eventType']).toBeDefined()
  })
})
