"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { reportService } from "@/features/reports"
import type { GetReportParams, EmailReportData } from "@/features/reports"

// Query key factory — includes params in the key so the cache invalidates
// automatically when the user changes date range or status filters
export const reportKeys = {
  all: ["reports"] as const,
  report: (params: GetReportParams) =>
    [...reportKeys.all, "report", params] as const,
}

// Fetches invoice report only after the user explicitly clicks "Generate Report"
// (params is null until then, which disables the query)
export const useReport = (params: GetReportParams | null) => {
  return useQuery({
    queryKey: reportKeys.report(params!),
    queryFn: () => reportService.getReport(params!),
    enabled: !!params,
  })
}

// Triggers a PDF download — no cache invalidation needed since this is a side effect
export const useExportPdf = () => {
  return useMutation({
    mutationFn: (params: GetReportParams) => reportService.exportPdf(params),
  })
}

// Queues an email on the backend — caller handles success/error toast feedback
export const useSendReportEmail = () => {
  return useMutation({
    mutationFn: (data: EmailReportData) => reportService.sendEmail(data),
  })
}
