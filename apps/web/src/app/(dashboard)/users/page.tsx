"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCurrentUser, useUsers } from "@/hooks/use-current-user"
import { useDebounce } from "@/hooks/use-debounce"
import { UserList } from "@/features/users/components/users-table"
import { Pagination } from "@/components/ui/pagination"

const USERS_PER_PAGE = 10
const SEARCH_DEBOUNCE_MS = 400

const UsersPage = () => {
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser()

  const debouncedSearch = useDebounce(searchInput.trim(), SEARCH_DEBOUNCE_MS)
  const isAdmin = currentUser?.role === "admin"

  const { data, isLoading } = useUsers(
    {
      email: debouncedSearch || undefined,
      page,
      limit: USERS_PER_PAGE,
    },
    isAdmin,
  )

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    setPage(1)
  }

  const handleClear = () => {
    setSearchInput("")
    setPage(1)
  }

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    )
  }

  const users = data?.data.users ?? []
  const pagination = data?.data.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage and view registered users.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        {searchInput && (
          <Button onClick={handleClear} variant="ghost" size="sm">
            Clear
          </Button>
        )}
      </div>

      {/* Users list */}
      <UserList users={users} isLoading={isLoading} />

      {/* Pagination */}
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

export default UsersPage
