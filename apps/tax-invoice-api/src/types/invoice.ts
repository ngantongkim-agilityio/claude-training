import { Document } from 'mongoose'

export enum InvoiceStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum InvoiceEventType {
  CREATED = 'created',
  EDITED = 'edited',
  SUBMITTED = 'submitted',
  RESUBMITTED = 'resubmitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DELETED = 'deleted',
}

export type InvoiceFieldChange = {
  old: string | number
  new: string | number
}

// Entries written before audit tracking have no eventType or actor (legacy)
export type InvoiceHistory = {
  eventType?: InvoiceEventType | null
  actor?: string
  changes?: Record<string, InvoiceFieldChange> | null
  createdAt?: Date
}

// History entry as returned by the list, detail and history responses
export type InvoiceHistoryEntry = {
  eventType: InvoiceEventType | null
  actor: string | null
  changes: Record<string, InvoiceFieldChange>
  createdAt?: string
  legacy?: true
}

export interface Invoice extends Document {
  invoiceNumber: string
  user: string
  status: InvoiceStatus
  amount: number
  tax?: number
  description?: string
  isDeleted?: boolean
  histories?: InvoiceHistory[]
  createdAt?: Date
  updatedAt?: Date
}
