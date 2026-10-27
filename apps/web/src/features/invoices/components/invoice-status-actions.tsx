"use client"

import { useState } from "react"
import { Send, CheckCircle, XCircle } from "lucide-react"
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

interface InvoiceStatusActionsProps {
  invoiceNumber: string
  status: InvoiceStatus
  userRole: "user" | "admin"
}

export const InvoiceStatusActions = ({
  invoiceNumber,
  status,
  userRole,
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
               Once submitted, the invoice will be sent for admin review. 
               After submission, it can no longer be edited or reverted to draft.
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
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                size="sm"
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                disabled={isPending}
              >
                <CheckCircle className="size-3.5" />
                Approve
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Approve invoice {invoiceNumber}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the invoice as approved. This action is final and
                cannot be reversed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleStatusUpdate("approved")}
              >
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {canReject && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                disabled={isPending}
              >
                <XCircle className="size-3.5" />
                Reject
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Reject invoice {invoiceNumber}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the invoice as rejected. This action is final and
                cannot be reversed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleStatusUpdate("rejected")}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </>
  )
}
