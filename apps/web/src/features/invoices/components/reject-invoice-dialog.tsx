"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { XCircle } from "lucide-react"
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
import {
  rejectInvoiceSchema,
  type RejectInvoiceFormData,
} from "@/features/invoices/schemas"
import { ReviewNoteField } from "./review-note-field"
import { ReviewError } from "./review-error"

interface RejectInvoiceDialogProps {
  invoiceNumber: string
  updatedAt: string
}

export const RejectInvoiceDialog = ({
  invoiceNumber,
  updatedAt,
}: RejectInvoiceDialogProps) => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { mutate, isPending } = useUpdateInvoiceStatus(invoiceNumber)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isValid },
  } = useForm<RejectInvoiceFormData>({
    resolver: zodResolver(rejectInvoiceSchema),
    mode: "onChange",
    defaultValues: { reason: "" },
  })
  const reason = useWatch({ control, name: "reason" }) ?? ""

  // The dialog stays open on failure so the admin keeps what they typed
  const onSubmit = ({ reason }: RejectInvoiceFormData) => {
    setError(null)
    mutate(
      { status: "rejected", reason, expectedUpdatedAt: updatedAt },
      {
        onSuccess: () => {
          setOpen(false)
          reset()
        },
        onError: (err) => setError(err),
      },
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <XCircle className="size-3.5" />
            Reject
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject invoice {invoiceNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            The owner will see your reason on the invoice and can fix and
            resubmit it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ReviewNoteField
          id="reject-reason"
          label="Reason for rejection"
          placeholder="Explain what needs to change, e.g. Tax should be 10% of the amount."
          hint={
            reason.trim() === ""
              ? "Enter a reason to reject this invoice."
              : undefined
          }
          length={reason.length}
          registration={register("reason")}
        />
        {error && <ReviewError
            invoiceNumber={invoiceNumber}
            error={error}
            onReloaded={() => setError(null)}
          />}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!isValid || isPending}
            onClick={handleSubmit(onSubmit)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Reject invoice
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
