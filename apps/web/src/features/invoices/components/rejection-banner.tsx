import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { InvoiceHistoryEntry } from "@/features/invoices/types"
import { ResubmitInvoiceDialog } from "./resubmit-invoice-dialog"

interface RejectionBannerProps {
  invoiceNumber: string
  // Latest rejected history entry, or null for a legacy invoice
  rejection: InvoiceHistoryEntry | null
  isOwner: boolean
  onEdit: () => void
}

export const RejectionBanner = ({
  invoiceNumber,
  rejection,
  isOwner,
  onEdit,
}: RejectionBannerProps) => {
  // Invoices rejected before reasons were recorded have no reason to show. The
  // approved wording has no variant without an admin, so a missing actor (only
  // legacy entries lack one) also falls back to the no-reason banner
  const hasReason = !!rejection?.reason && !!rejection.actor
  // Same date format as the Created row on the detail page
  const date = rejection?.createdAt
    ? new Date(rejection.createdAt).toLocaleDateString()
    : null
  const heading = hasReason
    ? `Rejected by ${rejection?.actor}${date ? ` on ${date}` : ""}`
    : "Rejected. No reason was recorded."

  return (
    <section
      aria-labelledby="rejection-banner-title"
      className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
    >
      <div className="space-y-1">
        <h2
          id="rejection-banner-title"
          className="text-sm font-semibold text-red-800 dark:text-red-300"
        >
          {heading}
        </h2>
        <p
          className="text-sm break-words whitespace-pre-wrap"
          style={{ overflowWrap: "anywhere" }}
        >
          {hasReason
            ? rejection?.reason
            : "This invoice was rejected before reasons were recorded."}
        </p>
      </div>
      {isOwner && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <ResubmitInvoiceDialog invoiceNumber={invoiceNumber} />
        </div>
      )}
    </section>
  )
}
