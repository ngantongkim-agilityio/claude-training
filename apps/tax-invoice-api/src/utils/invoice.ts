// Types
import { InvoiceStatus } from '@/types'

/**
 * Generates a unique invoice number string
 * Combines timestamp and random digits to avoid duplication
 *
 * @returns Invoice number (e.g., INV-1721124000000-5832)
 */
export const generateInvoiceNumber = (): string => {
  const timestamp = Date.now() // Same as new Date().getTime()
  const random = Math.floor(1000 + Math.random() * 9000) // 4-digit random number

  return `INV-${timestamp}-${random}`
}

/**
 * Check if a given string is a valid InvoiceStatus
 * @param value - string to check
 * @returns true if valid, false otherwise
 */
export const isInvoiceStatus = (value: string): value is InvoiceStatus => {
  return Object.values(InvoiceStatus).includes(value as InvoiceStatus)
}

type InvoiceUpdateFields = {
  amount?: number
  tax?: number
  description?: string
}

/**
 * Tracks and applies changes from updates to the invoice object.
 * Returns a map of changed fields with old and new values.
 */
export const trackInvoiceChanges = <T extends InvoiceUpdateFields>(
  invoice: T,
  updates: Partial<T>,
): {
  updatedInvoice: T
  changes: Partial<Record<keyof T, { old: T[keyof T]; new: T[keyof T] }>>
} => {
  const changes: Partial<
    Record<keyof T, { old: T[keyof T]; new: T[keyof T] }>
  > = {}
  const updatedInvoice = { ...invoice }

  Object.keys(updates).forEach((key) => {
    const field = key as keyof T
    const newValue = updates[field]
    const currentValue = invoice[field]

    if (typeof newValue !== 'undefined' && newValue !== currentValue) {
      changes[field] = { old: currentValue, new: newValue }
      updatedInvoice[field] = newValue as T[keyof T]
    }
  })

  return { updatedInvoice, changes }
}
