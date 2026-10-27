"use client"

import { useUIStore } from "@/store/ui-store"

export const SidebarOverlay = () => {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  if (!sidebarOpen) return null

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 md:hidden"
      onClick={() => setSidebarOpen(false)}
      aria-hidden="true"
    />
  )
}
