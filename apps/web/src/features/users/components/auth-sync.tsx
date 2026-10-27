"use client"

import { useEffect } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useAuthStore } from "@/store/auth-store"

export const AuthSync = () => {
  const { data: user } = useCurrentUser()
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    setUser(user ?? null)
  }, [user, setUser])

  return null
}
