import { apiClient } from "@/services/api-client"
import type {
  CreateInvoiceData,
  CreateInvoiceResponse,
  DeleteInvoiceResponse,
  GetInvoiceResponse,
  GetInvoicesParams,
  GetInvoicesResponse,
  UpdateInvoiceData,
  UpdateInvoiceResponse,
  UpdateInvoiceStatusData,
  UpdateInvoiceStatusResponse,
} from "./types"

export const invoiceService = {
  getInvoices: (params: GetInvoicesParams = {}) => {
    const searchParams = new URLSearchParams()

    if (params.search) searchParams.set("search", params.search)
    if (params.status) searchParams.set("status", params.status)
    if (params.from) searchParams.set("from", params.from)
    if (params.to) searchParams.set("to", params.to)
    if (params.sortBy) searchParams.set("sortBy", params.sortBy)
    if (params.order) searchParams.set("order", params.order)
    if (params.page) searchParams.set("page", String(params.page))
    if (params.limit) searchParams.set("limit", String(params.limit))

    const query = searchParams.toString()
    return apiClient<GetInvoicesResponse>(
      `/invoices${query ? `?${query}` : ""}`,
    )
  },

  getInvoice: (invoiceNumber: string) =>
    apiClient<GetInvoiceResponse>(`/invoices/${invoiceNumber}`),

  createInvoice: (data: CreateInvoiceData) =>
    apiClient<CreateInvoiceResponse>("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateInvoice: (invoiceNumber: string, data: UpdateInvoiceData) =>
    apiClient<UpdateInvoiceResponse>(`/invoices/${invoiceNumber}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateInvoiceStatus: (invoiceNumber: string, data: UpdateInvoiceStatusData) =>
    apiClient<UpdateInvoiceStatusResponse>(`/invoices/${invoiceNumber}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteInvoice: (invoiceNumber: string) =>
    apiClient<DeleteInvoiceResponse>(`/invoices/${invoiceNumber}`, {
      method: "DELETE",
    }),
}
