import type { Invoice, InvoiceStatus, PaginationMeta } from "@/features/invoices/types"

export interface GetReportParams {
  from: string
  to: string
  status?: InvoiceStatus
  page?: number
  limit?: number
}

export interface ReportSummary {
  totalInvoices: number
  totalAmount: number
  totalTax: number
  draftCount: number
  submittedCount: number
  approvedCount: number
  rejectedCount: number
}

export interface GetReportResponse {
  status: string
  message: string
  data: {
    summary: ReportSummary
    invoices: Invoice[]
    pagination: PaginationMeta
  }
}

export interface EmailReportData {
  from: string
  to: string
  status?: InvoiceStatus
  recipientEmail?: string
}

export interface EmailReportResponse {
  status: string
  message: string
  data: {
    jobId: string
  }
}
