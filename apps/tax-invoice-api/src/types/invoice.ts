import { Document } from 'mongoose'

export enum InvoiceStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type InvoiceFieldChange = {
  old: string | number
  new: string | number
}

export type InvoiceHistory = {
  changes?: Record<string, InvoiceFieldChange>
  createdAt?: Date
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
