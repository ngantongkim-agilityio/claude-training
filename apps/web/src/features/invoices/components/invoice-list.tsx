"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ArrowUpDown, ListFilter } from "lucide-react"
import type {
  Invoice,
  InvoiceStatus,
  GetInvoicesParams,
} from "@/features/invoices/types"
import { StatusBadge } from "./status-badge"

export type SortField = NonNullable<GetInvoicesParams["sortBy"]> | "amount"
type SortOrder = NonNullable<GetInvoicesParams["order"]>

interface InvoiceListProps {
  invoices: Invoice[]
  isLoading: boolean
  isError: boolean
  sortBy?: SortField
  order?: SortOrder
  onSort: (column: SortField) => void
  status: InvoiceStatus | ""
  onStatusChange: (value: InvoiceStatus | "") => void
  statusOptions?: { label: string; value: InvoiceStatus | "" }[]
}

const GRID_COLS =
  "grid-cols-[100px_1fr_100px_110px_120px] sm:grid-cols-[140px_1fr_100px_110px_120px] lg:grid-cols-[180px_1fr_100px_110px_120px]"

const SortButton = ({
  label,
  column,
  sortBy,
  order,
  onSort,
  className,
}: {
  label: string
  column: SortField
  sortBy?: SortField
  order?: SortOrder
  onSort: (column: SortField) => void
  className?: string
}) => {
  const isActive = sortBy === column

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`inline-flex cursor-pointer items-center gap-1 hover:text-foreground ${className ?? ""}`}
    >
      {label}
      {!isActive && <ArrowUpDown className="size-3.5 opacity-50" />}
      {isActive && order === "asc" && <ArrowUp className="size-3.5" />}
      {isActive && order === "desc" && <ArrowDown className="size-3.5" />}
    </button>
  )
}

export const STATUS_OPTIONS: { label: string; value: InvoiceStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

const StatusHeaderFilter = ({
  value,
  onChange,
  options = STATUS_OPTIONS,
}: {
  value: InvoiceStatus | ""
  onChange: (value: InvoiceStatus | "") => void
  options?: { label: string; value: InvoiceStatus | "" }[]
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex cursor-pointer items-center gap-1 hover:text-foreground"
      >
        Status
        <ListFilter
          className={`size-3.5 ${value ? "text-primary" : "opacity-50"}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-10 mt-1 min-w-[120px] rounded-lg border bg-background py-1 shadow-md">
          {options.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`flex w-full cursor-pointer px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                value === option.value
                  ? "font-medium text-primary"
                  : "text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const InvoiceList = ({
  invoices,
  isLoading,
  isError,
  sortBy,
  order,
  onSort,
  status,
  onStatusChange,
  statusOptions,
}: InvoiceListProps) => {
  return (
    <div className="rounded-lg border">
      {/* Header */}
      <div
        className={`grid ${GRID_COLS} items-center gap-4 border-b px-4 py-2 text-sm font-medium text-foreground`}
      >
        <span>Invoice #</span>
        <span>Owner</span>
        <SortButton
          label="Amount"
          column="amount"
          sortBy={sortBy}
          order={order}
          onSort={onSort}
          className="justify-end"
        />
        <StatusHeaderFilter value={status} onChange={onStatusChange} options={statusOptions} />
        <SortButton
          label="Created"
          column="createdAt"
          sortBy={sortBy}
          order={order}
          onSort={onSort}
          className="justify-end"
        />
      </div>

      {/* Table body */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && isError && (
        <p className="py-12 text-center text-sm text-destructive">
          Failed to load invoices. Please try again.
        </p>
      )}

      {!isLoading && !isError && invoices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No invoices found.
          </p>
        </div>
      )}

      {!isLoading && !isError && invoices.length > 0 && (
        <div className="divide-y">
          {invoices.map((invoice) => (
            <Link
              key={invoice.invoiceNumber}
              href={`/invoices/${invoice.invoiceNumber}`}
              className={`grid ${GRID_COLS} items-center gap-4 px-4 py-3 transition-colors hover:bg-accent`}
            >
              <span
                className="truncate text-sm font-medium"
                title={invoice.invoiceNumber}
              >
                {invoice.invoiceNumber}
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {invoice.user}
              </span>
              <span className="text-right text-sm tabular-nums">
                $
                {invoice.amount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="flex justify-end">
                <StatusBadge status={invoice.status} />
              </span>
              <span className="text-right text-sm text-muted-foreground">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
