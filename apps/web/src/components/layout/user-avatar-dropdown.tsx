"use client"

import { LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserAvatarDropdownProps {
  email?: string
  isAdmin?: boolean
  isLoading?: boolean
}

export const UserAvatarDropdown = ({
  email,
  isAdmin,
  isLoading,
}: UserAvatarDropdownProps) => {
  const initials = email ? email[0].toUpperCase() : "?"

  const handleLogout = () => {
    window.location.replace("/auth/logout")
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="size-8 animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex cursor-pointer items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="User menu"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-3 font-normal">
            <div className="flex min-w-0 flex-col gap-1">
              {email && (
                <p className="truncate text-sm font-medium leading-normal" title={email}>
                  {email}
                </p>
              )}
              {isAdmin && (
                <p className="text-xs text-muted-foreground">Administrator</p>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
