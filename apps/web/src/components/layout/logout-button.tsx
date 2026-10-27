"use client"

import { LogOut } from "lucide-react"

export const LogoutButton = () => {
  const handleLogout = () => {
    window.location.replace("/auth/logout")
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
    >
      <LogOut className="size-4" />
      Sign out
    </button>
  )
}
