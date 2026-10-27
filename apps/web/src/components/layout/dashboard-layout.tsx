"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AuthSync } from "@/features/users/components/auth-sync"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { data: user, isLoading } = useCurrentUser()

  return (
    <div className="flex h-screen overflow-hidden">
      <AuthSync />
      <Sidebar isAdmin={user?.role === "admin"} />
      <div className="flex flex-1 flex-col overflow-hidden md:pl-58">
        <Header userEmail={user?.email} isAdmin={user?.role === "admin"} isLoading={isLoading} />
        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}
