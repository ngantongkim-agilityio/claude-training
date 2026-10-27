"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useReport, useExportPdf, useSendReportEmail } from "@/hooks/use-reports"
import { useAuthStore } from "@/store/auth-store"
import { ReportFilters } from "@/features/reports/components/report-filters"
import { ReportSummaryCards } from "@/features/reports/components/report-summary-cards"
import { ReportInvoiceTable } from "@/features/reports/components/report-invoice-table"
import { SendEmailDialog } from "@/features/reports/components/send-email-dialog"
import { Pagination } from "@/components/ui/pagination"
import type { InvoiceStatus } from "@/features/invoices/types"
import type { GetReportParams } from "@/features/reports/types"

const REPORTS_PER_PAGE = 10

const ReportsPage = () => {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [status, setStatus] = useState<InvoiceStatus | "">("")
  const [page, setPage] = useState(1)

  const [activeParams, setActiveParams] = useState<GetReportParams | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)

  const user = useAuthStore((state) => state.user)
  const { data, isLoading, isError } = useReport(activeParams)
  const exportPdf = useExportPdf()
  const sendEmail = useSendReportEmail()

  // Snapshot filter values into activeParams to trigger the report query.
  // This ensures changing filters alone doesn't re-fetch — only an explicit click does.
  const handleGenerate = () => {
    if (!from || !to) return
    setPage(1)
    setActiveParams({
      from,
      to,
      status: status || undefined,
      page: 1,
      limit: REPORTS_PER_PAGE,
    })
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setActiveParams((prev) =>
      prev ? { ...prev, page: newPage } : prev,
    )
  }

  // Re-uses the currently active report params for PDF export
  const handleExportPdf = () => {
    if (!activeParams) return
    exportPdf.mutate(activeParams, {
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  // Sends the report with the same filters used for generation.
  // Uses the logged-in user's email as recipient when no custom email is provided.
  const handleSendEmail = (recipientEmail?: string) => {
    if (!activeParams) return
    sendEmail.mutate(
      { ...activeParams, recipientEmail: recipientEmail || user?.email },
      {
        onSuccess: () => {
          setEmailDialogOpen(false)
          toast.success("Report email queued successfully. It will be sent shortly.")
        },
        onError: (error) => {
          toast.error(error.message)
        },
      },
    )
  }

  const summary = data?.data.summary
  const invoices = data?.data.invoices ?? []
  const pagination = data?.data.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate invoice reports by date range and status.
        </p>
      </div>

      <ReportFilters
        from={from}
        to={to}
        status={status}
        onFromChange={setFrom}
        onToChange={setTo}
        onStatusChange={setStatus}
      />

      <div className="flex items-center gap-2">
        <Button
          onClick={handleGenerate}
          disabled={!from || !to || from > to || isLoading}
        >
          {isLoading ? "Loading..." : "Generate Report"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleExportPdf}
          disabled={!activeParams || exportPdf.isPending}
        >
          <Download className="size-4" />
          {exportPdf.isPending ? "Exporting..." : "Export PDF"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setEmailDialogOpen(true)}
          disabled={!activeParams}
        >
          <Mail className="size-4" />
          Send Email
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <p className="py-8 text-center text-sm text-destructive">
          Failed to load report. Please try again.
        </p>
      )}

      {summary && !isLoading && (
        <>
          <ReportSummaryCards summary={summary} title="Summary" />

          <ReportInvoiceTable invoices={invoices} title="Invoices" />

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      <SendEmailDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        onSend={handleSendEmail}
        isPending={sendEmail.isPending}
      />
    </div>
  )
}

export default ReportsPage
