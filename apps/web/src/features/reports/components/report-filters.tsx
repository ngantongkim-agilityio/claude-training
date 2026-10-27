"use client"

import { useRef } from "react"
import { Calendar } from "lucide-react"
import { Label } from "@/components/ui/label"
import { formatDisplayDate } from "@/utils/format"
import type { InvoiceStatus } from "@/features/invoices/types"

interface ReportFiltersProps {
  from: string
  to: string
  status: InvoiceStatus | ""
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onStatusChange: (value: InvoiceStatus | "") => void
}

const STATUS_OPTIONS: { label: string; value: InvoiceStatus | "" }[] = [
  { label: "All Statuses", value: "" },
  { label: "Submitted", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

interface DatePickerButtonProps {
  id: string
  label: string
  value: string
  max?: string
  placeholder?: string
  onChange: (value: string) => void
}

const DatePickerButton = ({
  id,
  label,
  value,
  max,
  placeholder = "Select date",
  onChange,
}: DatePickerButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.showPicker()
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <button
        type="button"
        onClick={handleClick}
        className="flex h-8 w-40 cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
        <span className={value ? "text-foreground" : "text-muted-foreground/70"}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="date"
          value={value}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}

export const ReportFilters = ({
  from,
  to,
  status,
  onFromChange,
  onToChange,
  onStatusChange,
}: ReportFiltersProps) => {
  // Prevent future date selection — reports can only cover historical data
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="flex flex-wrap items-end gap-4">
      <DatePickerButton
        id="report-from"
        label="From"
        value={from}
        max={today}
        placeholder="Start date"
        onChange={onFromChange}
      />

      <DatePickerButton
        id="report-to"
        label="To"
        value={to}
        max={today}
        placeholder="End date"
        onChange={onToChange}
      />

      <div className="space-y-1.5">
        <Label htmlFor="report-status">Status</Label>
        <select
          id="report-status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as InvoiceStatus | "")}
          className="h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
