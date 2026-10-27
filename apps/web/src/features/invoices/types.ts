export type InvoiceStatus = "draft" | "submitted" | "approved" | "rejected"

export interface Invoice {
  invoiceNumber: string
  user: string
  status: InvoiceStatus
  amount: number
  tax?: number
  description?: string
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
