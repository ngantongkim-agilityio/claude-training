export type InvoiceStatus = "draft" | "submitted" | "approved" | "rejected"

export type InvoiceEventType =
  | "created"
  | "edited"
  | "submitted"
  | "resubmitted"
  | "approved"
  | "rejected"
  | "deleted"

export interface InvoiceFieldChange {
  old?: unknown
  new?: unknown
}

// One entry of the detail response's `histories`, which the API returns oldest first
export interface InvoiceHistoryEntry {
  // null only for legacy entries whose type can't be inferred
  eventType: InvoiceEventType | null
  // null for legacy entries, which never recorded who acted
  actor: string | null
  changes: Record<string, InvoiceFieldChange>
  createdAt?: string
  legacy?: true
  // Present on rejected entries once the API records reasons (KAN-5)
  reason?: string
  // Present on approved entries when the admin left one (KAN-5)
  comment?: string
}

export interface Invoice {
  invoiceNumber: string
  user: string
  status: InvoiceStatus
  amount: number
  tax?: number
  description?: string
  histories?: InvoiceHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export interface GetInvoicesParams {
  search?: string
  status?: InvoiceStatus
  from?: string
  to?: string
  sortBy?: "createdAt" | "updatedAt"
  order?: "asc" | "desc"
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GetInvoicesResponse {
  status: string
  message: string
  data: {
    invoices: Invoice[]
    pagination: PaginationMeta
  }
}

export interface CreateInvoiceData {
  amount: number
  tax?: number
  description?: string
}

export interface CreateInvoiceResponse {
  status: string
  message: string
  data: {
    invoiceNumber: string
    status: InvoiceStatus
  }
}

export interface GetInvoiceResponse {
  status: string
  message: string
  data: {
    invoice: Invoice
  }
}

export interface UpdateInvoiceData {
  amount?: number
  tax?: number
  description?: string
}

export interface UpdateInvoiceResponse {
  status: string
  message: string
  data: {
    invoiceNumber: string
    updatedFields: string[]
  }
}

export interface UpdateInvoiceStatusData {
  status: InvoiceStatus
}

export interface UpdateInvoiceStatusResponse {
  status: string
  message: string
  data: {
    invoiceNumber: string
    status: InvoiceStatus
  }
}

export interface DeleteInvoiceResponse {
  status: string
  message: string
  data: {
    invoiceNumber: string
    deleted: boolean
  }
}
