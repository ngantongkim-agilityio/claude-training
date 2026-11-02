import { Button } from "@/components/ui/button"
import { useInvoice } from "@/hooks/use-invoices"
import { isInvoiceChanged } from "@/services/api-client"

interface ReviewErrorProps {
  invoiceNumber: string
  error: Error
  // Called once Reload has fetched the latest version, so the parent can clear the error
  onReloaded: () => void
}

// Shown inside a dialog so the typed text survives; a 409 means the invoice
// changed since it was opened, and Reload refetches it without closing the dialog
export const ReviewError = ({
  invoiceNumber,
  error,
  onReloaded,
}: ReviewErrorProps) => {
  const { refetch, isFetching } = useInvoice(invoiceNumber)

  const handleReload = async () => {
    const result = await refetch()
    if (!result.isError) onReloaded()
  }

  if (isInvoiceChanged(error)) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        <span>This invoice has changed since you opened it.</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={handleReload}
        >
          Reload
        </Button>
      </div>
    )
  }

  return (
    <p
      role="alert"
      className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {error.message}
    </p>
  )
}
