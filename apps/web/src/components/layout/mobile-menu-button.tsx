"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/store/ui-store"

export const MobileMenuButton = () => {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={() => setSidebarOpen(!sidebarOpen)}
      aria-label="Toggle sidebar"
    >
      <Menu className="size-5" />
    </Button>
  )
}
