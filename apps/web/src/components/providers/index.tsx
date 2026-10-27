"use client"

import { Toaster } from "sonner"
import { QueryProvider } from "./query-provider"

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryProvider>
      {children}
      <Toaster position="top-right" richColors />
    </QueryProvider>
  )
}
