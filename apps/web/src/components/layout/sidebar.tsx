"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/utils/cn"
import { useUIStore } from "@/store/ui-store"
import { navItems } from "./nav-items"
import { SidebarOverlay } from "./sidebar-overlay"

interface SidebarProps {
  isAdmin?: boolean
}

export const Sidebar = ({ isAdmin }: SidebarProps) => {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <>
      <SidebarOverlay />
      <aside
        data-open={sidebarOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-58 flex-col",
          "border-r border-sidebar-border bg-sidebar",
          "transition-transform duration-200 ease-in-out",
          "-translate-x-full md:translate-x-0",
          "data-[open=true]:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link
            href="/invoices"
            className="text-lg font-semibold text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            Tax Invoice Dashboard
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-accent text-foreground font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

      </aside>
    </>
  )
}
