"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import { CreateInvoiceForm } from "@/features/invoices/components/create-invoice-form"

const CreateInvoicePage = () => {
  const { data: currentUser, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (currentUser?.role === "admin") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">
          Only regular users can create invoices.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Invoice</h1>
        <p className="text-sm text-muted-foreground">
          Create a new tax invoice. It will start as a draft.
        </p>
      </div>

      <CreateInvoiceForm />
    </div>
  )
}

export default CreateInvoicePage
