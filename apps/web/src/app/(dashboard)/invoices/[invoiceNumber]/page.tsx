"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInvoice } from "@/hooks/use-invoices"
import { useCurrentUser } from "@/hooks/use-current-user"
import { StatusBadge } from "@/features/invoices/components/status-badge"
import { EditInvoiceForm } from "@/features/invoices/components/edit-invoice-form"
import { InvoiceStatusActions } from "@/features/invoices/components/invoice-status-actions"
import { DeleteInvoiceButton } from "@/features/invoices/components/delete-invoice-button"

const DetailRow = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="grid grid-cols-[120px_1fr] gap-4 py-2.5">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="break-words text-sm font-medium" style={{ overflowWrap: "anywhere" }}>
      {children}
    </span>
  </div>
)

const InvoiceDetailPage = () => {
  const params = useParams<{ invoiceNumber: string }>()
  const invoiceNumber =
    typeof params.invoiceNumber === "string" ? params.invoiceNumber : ""
  const [isEditing, setIsEditing] = useState(false)
  const { data, isLoading, isError } = useInvoice(invoiceNumber)
  const { data: currentUser } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to invoices
        </Link>
        <p className="text-sm text-destructive">
          Failed to load invoice. It may not exist or you lack permission.
        </p>
      </div>
    )
  }

  const invoice = data.data.invoice
  const userRole = currentUser?.role === "admin" ? "admin" : "user"
  const canEdit = userRole !== "admin" && invoice.status === "draft"
  const canDelete = userRole !== "admin" && invoice.status === "draft"

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
            <div className="mt-0.5 flex items-center gap-2">
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InvoiceStatusActions
            invoiceNumber={invoice.invoiceNumber}
            status={invoice.status}
            userRole={userRole}
          />
          {canEdit && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          )}
          {canDelete && (
            <DeleteInvoiceButton invoiceNumber={invoice.invoiceNumber} />
          )}
        </div>
      </div>

      {isEditing ? (
        <EditInvoiceForm
          invoice={invoice}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      ) : (
        <div className="rounded-lg border p-4">
          <div className="divide-y">
            <DetailRow label="Amount">
              $
              {invoice.amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </DetailRow>
            <DetailRow label="Tax">
              {invoice.tax != null
                ? `$${invoice.tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                : "—"}
            </DetailRow>
            <DetailRow label="Description">
              {invoice.description || "—"}
            </DetailRow>
            <DetailRow label="Created">
              {new Date(invoice.createdAt).toLocaleDateString()}
            </DetailRow>
            <DetailRow label="Updated">
              {new Date(invoice.updatedAt).toLocaleDateString()}
            </DetailRow>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoiceDetailPage
