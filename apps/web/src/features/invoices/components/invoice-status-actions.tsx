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
import type { InvoiceStatus } from "@/features/invoices/types"
import { ApproveInvoiceDialog } from "./approve-invoice-dialog"
import { RejectInvoiceDialog } from "./reject-invoice-dialog"

interface InvoiceStatusActionsProps {
  invoiceNumber: string
  status: InvoiceStatus
  userRole: "user" | "admin"
  // Sent with approve/reject so the API can refuse a stale review
  updatedAt: string
}

export const InvoiceStatusActions = ({
  invoiceNumber,
  status,
  userRole,
  updatedAt,
}: InvoiceStatusActionsProps) => {
  const [error, setError] = useState<string | null>(null)
  const { mutate, isPending } = useUpdateInvoiceStatus(invoiceNumber)

  const handleStatusUpdate = (newStatus: InvoiceStatus) => {
    setError(null)
    mutate(
      { status: newStatus },
      {
        onError: (err) => {
          setError(err.message)
        },
      },
    )
  }

  const canSubmit = userRole === "user" && status === "draft"
  const canApprove = userRole === "admin" && status === "submitted"
  const canReject = userRole === "admin" && status === "submitted"

  if (!canSubmit && !canApprove && !canReject) return null

  return (
    <>
      {canSubmit && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button size="sm" disabled={isPending}>
                <Send className="size-3.5" />
                Submit
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit invoice {invoiceNumber}?</AlertDialogTitle>
              <AlertDialogDescription>
                The invoice goes to finance for review. You can still edit it
                while it&apos;s under review, and every change is recorded in its
                history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleStatusUpdate("submitted")}
              >
                Submit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {canApprove && (
        <ApproveInvoiceDialog
          invoiceNumber={invoiceNumber}
          updatedAt={updatedAt}
        />
      )}
      {canReject && (
        <RejectInvoiceDialog
          invoiceNumber={invoiceNumber}
          updatedAt={updatedAt}
        />
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </>
  )
}
