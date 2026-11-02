"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useUpdateInvoiceStatus } from "@/hooks/use-invoices"
import { ReviewError } from "./review-error"

interface ResubmitInvoiceDialogProps {
  invoiceNumber: string
}

export const ResubmitInvoiceDialog = ({
  invoiceNumber,
}: ResubmitInvoiceDialogProps) => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { mutate, isPending } = useUpdateInvoiceStatus(invoiceNumber)

  // No expectedUpdatedAt: the contract only asks for it on approve and reject
  const handleResubmit = () => {
    setError(null)
    mutate(
      { status: "submitted" },
      {
        onSuccess: () => setOpen(false),
        onError: (err) => setError(err),
      },
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button size="sm" disabled={isPending}>
            <Send className="size-3.5" />
            Resubmit
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resubmit invoice {invoiceNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            The invoice goes back to finance for review. Check that you&apos;ve
            fixed what the rejection reason describes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <ReviewError
            invoiceNumber={invoiceNumber}
            error={error}
            onReloaded={() => setError(null)}
          />
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleResubmit}>
            Resubmit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
