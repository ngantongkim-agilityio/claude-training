"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
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
import { useDeleteInvoice } from "@/hooks/use-invoices"

interface DeleteInvoiceButtonProps {
  invoiceNumber: string
}

export const DeleteInvoiceButton = ({
  invoiceNumber,
}: DeleteInvoiceButtonProps) => {
  const [error, setError] = useState<string | null>(null)
  const { mutate, isPending } = useDeleteInvoice(invoiceNumber)

  const handleDelete = () => {
    setError(null)
    mutate(undefined, {
      onError: (err) => {
        setError(err.message)
      },
    })
  }

  return (
    <div className="space-y-2">
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant="destructive" size="sm" disabled={isPending}>
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice {invoiceNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the invoice. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
