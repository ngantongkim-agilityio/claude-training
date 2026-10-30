import { formatAmount } from "@/utils/format"
import type {
  InvoiceEventType,
  InvoiceFieldChange,
  InvoiceHistoryEntry,
} from "./types"

const EVENT_LABELS: Record<InvoiceEventType, string> = {
  created: "Created",
  edited: "Edited",
  submitted: "Submitted",
  resubmitted: "Resubmitted",
  approved: "Approved",
  rejected: "Rejected",
  // Deleted invoices are never shown; listed only to cover every event type
  deleted: "Deleted",
}

const FIELD_LABELS: Record<string, string> = {
  amount: "Amount",
  tax: "Tax",
  description: "Description",
}

const AMOUNT_FIELDS = new Set(["amount", "tax"])

// The API returns entries oldest first and the cached array is shared with other
// readers, so reverse a copy for display instead of sorting in place
export const toNewestFirst = (histories: InvoiceHistoryEntry[]) =>
  [...histories].reverse()

// Wording for legacy entries is client-approved (IDR-1)
export const getEventLabel = (entry: InvoiceHistoryEntry) => {
  if (entry.legacy) {
    return entry.eventType === "edited"
      ? "Edited (before audit tracking). Actor not recorded."
      : "Recorded before audit tracking. Details not available."
  }
  return entry.eventType ? EVENT_LABELS[entry.eventType] : "Unknown event"
}

const formatValue = (field: string, value: unknown) => {
  if (value == null || value === "") return "—"
  // The API types change values as string | number, so accept numeric strings too
  const amount = Number(value)
  if (AMOUNT_FIELDS.has(field) && Number.isFinite(amount)) {
    return formatAmount(amount)
  }
  return String(value)
}

export const formatChange = (field: string, change: InvoiceFieldChange) => {
  const label =
    FIELD_LABELS[field] ?? field.charAt(0).toUpperCase() + field.slice(1)
  return `${label}: ${formatValue(field, change.old)} → ${formatValue(field, change.new)}`
}
