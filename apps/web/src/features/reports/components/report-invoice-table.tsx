"use client"

import type { Invoice } from "@/features/invoices/types"
import { StatusBadge } from "@/features/invoices/components/status-badge"

interface ReportInvoiceTableProps {
  invoices: Invoice[]
  title?: string
}

// Flexible grid columns: Invoice # and Owner use minmax so they expand to show
// full content on wider screens, and only truncate when space is genuinely tight.
// The 1fr/1.5fr ratio gives the Owner (email) column more share of available space.
const GRID_COLS =
  "grid-cols-[minmax(100px,1fr)_minmax(100px,1.5fr)_100px_100px_110px] sm:grid-cols-[minmax(140px,1fr)_minmax(160px,1.5fr)_100px_100px_120px]"

const TruncatedCell = ({
  value,
  className,
}: {
  value: string
  className?: string
}) => (
  <span className={`group/tip relative min-w-0 ${className ?? ""}`}>
    <span className="block truncate">{value}</span>
    <span className="pointer-events-none invisible absolute bottom-full left-0 z-10 mb-1.5 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity duration-0 group-hover/tip:visible group-hover/tip:opacity-100">
      {value}
    </span>
  </span>
)

export const ReportInvoiceTable = ({ invoices, title }: ReportInvoiceTableProps) => {
  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border py-12 text-center">
        {title && (
          <h2 className="mb-4 px-4 text-lg font-semibold text-foreground">{title}</h2>
        )}
        <p className="text-sm text-muted-foreground">
          No invoices match the selected filters.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      {title && (
        <h2 className="border-b px-4 py-3 text-lg font-semibold text-foreground">{title}</h2>
      )}
      <div
        className={`grid ${GRID_COLS} items-center gap-4 border-b px-4 py-2 text-sm font-medium text-foreground`}
      >
        <span>Invoice #</span>
        <span>Owner</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Tax</span>
        <span className="text-right">Status</span>
      </div>

      <div className="divide-y">
        {invoices.map((invoice) => (
          <div
            key={invoice.invoiceNumber}
            className={`grid ${GRID_COLS} items-center gap-4 px-4 py-3`}
          >
            <TruncatedCell
              value={invoice.invoiceNumber}
              className="text-sm font-medium"
            />
            <TruncatedCell
              value={invoice.user}
              className="text-sm text-muted-foreground"
            />
            <span className="text-right text-sm tabular-nums">
              ${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-right text-sm tabular-nums">
              ${(invoice.tax ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span className="flex justify-end">
              <StatusBadge status={invoice.status} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
