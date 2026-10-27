"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { invoiceService } from "@/features/invoices"
import type {
  GetInvoicesParams,
  CreateInvoiceData,
  UpdateInvoiceData,
  UpdateInvoiceStatusData,
} from "@/features/invoices"

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (params: GetInvoicesParams) =>
    [...invoiceKeys.all, "list", params] as const,
  detail: (invoiceNumber: string) =>
    [...invoiceKeys.all, "detail", invoiceNumber] as const,
}

export const useInvoices = (params: GetInvoicesParams = {}) => {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoiceService.getInvoices(params),
  })
}

export const useInvoice = (invoiceNumber: string) => {
  return useQuery({
    queryKey: invoiceKeys.detail(invoiceNumber),
    queryFn: () => invoiceService.getInvoice(invoiceNumber),
    enabled: !!invoiceNumber,
  })
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInvoiceData) =>
      invoiceService.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}

export const useUpdateInvoice = (invoiceNumber: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateInvoiceData) =>
      invoiceService.updateInvoice(invoiceNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}

export const useUpdateInvoiceStatus = (invoiceNumber: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateInvoiceStatusData) =>
      invoiceService.updateInvoiceStatus(invoiceNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}

export const useDeleteInvoice = (invoiceNumber: string) => {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => invoiceService.deleteInvoice(invoiceNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
      router.push("/invoices")
    },
  })
}
