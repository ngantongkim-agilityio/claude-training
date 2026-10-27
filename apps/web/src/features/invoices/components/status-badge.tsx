"use client"

import { cn } from "@/utils/cn"
import type { InvoiceStatus } from "@/features/invoices/types"

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  approved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

interface StatusBadgeProps {
  status: InvoiceStatus
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  )
}
