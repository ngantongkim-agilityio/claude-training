"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle } from "lucide-react"
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
  approveInvoiceSchema,
  type ApproveInvoiceFormData,
} from "@/features/invoices/schemas"
import { ReviewNoteField } from "./review-note-field"
import { ReviewError } from "./review-error"

interface ApproveInvoiceDialogProps {
  invoiceNumber: string
  updatedAt: string
}

export const ApproveInvoiceDialog = ({
  invoiceNumber,
  updatedAt,
}: ApproveInvoiceDialogProps) => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { mutate, isPending } = useUpdateInvoiceStatus(invoiceNumber)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isValid },
  } = useForm<ApproveInvoiceFormData>({
    resolver: zodResolver(approveInvoiceSchema),
    mode: "onChange",
    defaultValues: { comment: "" },
  })
  const comment = useWatch({ control, name: "comment" }) ?? ""

  // The dialog stays open on failure so the admin keeps what they typed
  const onSubmit = ({ comment }: ApproveInvoiceFormData) => {
    setError(null)
    mutate(
      {
        status: "approved",
        // A blank comment is omitted: the API treats a present comment as a note
        ...(comment ? { comment } : {}),
        expectedUpdatedAt: updatedAt,
      },
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
            className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <CheckCircle className="size-3.5" />
            Approve
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve invoice {invoiceNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            Approved invoices can&apos;t be changed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ReviewNoteField
          id="approve-comment"
          label="Comment (optional)"
          length={comment.length}
          registration={register("comment")}
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
          >
            Approve
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
