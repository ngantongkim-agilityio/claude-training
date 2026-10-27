"use client"

import type { User } from "@/features/users/types"

interface UserListProps {
  users: User[]
  isLoading: boolean
}

export const UserList = ({ users, isLoading }: UserListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No users found.
      </p>
    )
  }
  
  return (
    <div className="rounded-lg border">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto] gap-4 border-b px-4 py-2 text-sm font-medium text-foreground">
        <span>Email</span>
        <span>Role</span>
      </div>

      {/* User rows */}
      <div className="divide-y">
        {users.map((user) => (
          <div
            key={user.email}
            className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-accent"
          >
            <span className="truncate text-sm">{user.email}</span>
            <span
              className={
                user.role === "admin"
                  ? "rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  : "rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              }
            >
              {user.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
