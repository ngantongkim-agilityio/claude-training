"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"
import { useInvoices } from "@/hooks/use-invoices"
import { useCurrentUser } from "@/hooks/use-current-user"
import { InvoiceList } from "@/features/invoices/components/invoice-list"
import { STATUS_OPTIONS } from "@/features/invoices/components/invoice-list"
import type { SortField } from "@/features/invoices/components/invoice-list"
import { Pagination } from "@/components/ui/pagination"
import type { GetInvoicesParams, InvoiceStatus } from "@/features/invoices/types"

const INVOICES_PER_PAGE = 10
const SEARCH_DEBOUNCE_MS = 400

const InvoicesPage = () => {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<InvoiceStatus | "">("")
  const [sortBy, setSortBy] = useState<SortField>("createdAt")
  const [order, setOrder] = useState<GetInvoicesParams["order"]>("desc")
  const [page, setPage] = useState(1)
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.role === "admin"

  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS)

  const isClientSort = sortBy === "amount"

  const { data, isLoading, isError } = useInvoices({
    search: debouncedSearch || undefined,
    status: status || undefined,
    sortBy: isClientSort ? undefined : sortBy,
    order: isClientSort ? undefined : order,
    page,
    limit: INVOICES_PER_PAGE,
  })

  const adminStatusOptions = STATUS_OPTIONS.filter(
    (option) => option.value !== "draft"
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusChange = (value: InvoiceStatus | "") => {
    setStatus(value)
    setPage(1)
  }

  const handleSort = (column: SortField) => {
    if (sortBy === column) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(column)
      setOrder("desc")
    }
    setPage(1)
  }

  const handleClear = () => {
    setSearch("")
    setPage(1)
  }

  const rawInvoices = useMemo(() => data?.data.invoices ?? [], [data])
  const pagination = data?.data.pagination

  const invoices = useMemo(() => {
    if (!isClientSort) return rawInvoices
    const sorted = [...rawInvoices]
    sorted.sort((a, b) =>
      order === "asc" ? a.amount - b.amount : b.amount - a.amount
    )
    return sorted
  }, [rawInvoices, isClientSort, order])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Review and manage submitted invoices."
              : "Manage your tax invoices here."}
          </p>
        </div>
        {!isAdmin && (
          <Link
            href="/invoices/create"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            <Plus className="size-4" />
            Create Invoice
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        {search && (
          <Button onClick={handleClear} variant="ghost" size="sm">
            Clear
          </Button>
        )}
      </div>

      <InvoiceList
        invoices={invoices}
        isLoading={isLoading}
        isError={isError}
        sortBy={sortBy}
        order={order}
        onSort={handleSort}
        status={status}
        onStatusChange={handleStatusChange}
        statusOptions={isAdmin ? adminStatusOptions : undefined}
      />

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

export default InvoicesPage
