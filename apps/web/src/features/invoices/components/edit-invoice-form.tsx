"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUpdateInvoice } from "@/hooks/use-invoices"
import type { Invoice } from "../types"
import { editInvoiceSchema, type EditInvoiceFormData } from "../schemas"

interface EditInvoiceFormProps {
  invoice: Invoice
  onCancel: () => void
  onSuccess: () => void
}

export const EditInvoiceForm = ({
  invoice,
  onCancel,
  onSuccess,
}: EditInvoiceFormProps) => {
  const [error, setError] = useState<string | null>(null)
  const { mutateAsync } = useUpdateInvoice(invoice.invoiceNumber)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<EditInvoiceFormData>({
    resolver: zodResolver(editInvoiceSchema),
    mode: "onChange",
    defaultValues: {
      amount: invoice.amount,
      tax: invoice.tax,
      description: invoice.description ?? "",
    },
  })

  const onSubmit = async (data: EditInvoiceFormData) => {
    setError(null)
    try {
      await mutateAsync({
        amount: data.amount,
        tax: data.tax,
        description: data.description || undefined,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update invoice")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          disabled={isSubmitting}
          aria-invalid={!!errors.amount}
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tax">Tax (optional)</Label>
        <Input
          id="tax"
          type="number"
          step="0.01"
          placeholder="0.00"
          disabled={isSubmitting}
          aria-invalid={!!errors.tax}
          {...register("tax", {
            setValueAs: (v: string) =>
              v === "" ? undefined : Number(v),
          })}
        />
        {errors.tax && (
          <p className="text-xs text-destructive">{errors.tax.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          rows={3}
          placeholder="Invoice description..."
          disabled={isSubmitting}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground/70 placeholder:text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
          {...register("description")}
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!isDirty || !isValid || isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Save Changes
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
