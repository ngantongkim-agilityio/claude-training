"use client"

import type { ReportSummary } from "@/features/reports/types"

interface ReportSummaryCardsProps {
  summary: ReportSummary
  title?: string
}

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color?: string
}) => (
  <div className="space-y-1 p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className={`text-2xl font-semibold tabular-nums ${color ?? ""}`}>
      {value}
    </p>
  </div>
)

export const ReportSummaryCards = ({ summary, title }: ReportSummaryCardsProps) => {
  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}

      <div className="rounded-lg border">
        <h3 className="border-b px-4 py-3 text-sm font-semibold text-foreground">
          Overview
        </h3>
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
          <StatCard label="Total Invoices" value={summary.totalInvoices} />
          <StatCard
            label="Total Amount"
            value={formatCurrency(summary.totalAmount)}
          />
          <StatCard
            label="Total Tax"
            value={formatCurrency(summary.totalTax)}
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <h3 className="border-b px-4 py-3 text-sm font-semibold text-foreground">
          Status Breakdown
        </h3>
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
          <StatCard
            label="Submitted"
            value={summary.submittedCount}
            color="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Approved"
            value={summary.approvedCount}
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            label="Rejected"
            value={summary.rejectedCount}
            color="text-red-600 dark:text-red-400"
          />
        </div>
      </div>
    </div>
  )
}
