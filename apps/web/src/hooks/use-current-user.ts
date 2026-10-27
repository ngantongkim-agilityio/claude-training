"use client"

import { useQuery } from "@tanstack/react-query"
import { userService } from "@/features/users"
import type { GetUsersParams } from "@/features/users"

export const userKeys = {
  all: ["users"] as const,
  list: (params: GetUsersParams) => [...userKeys.all, "list", params] as const,
  me: ["user", "me"] as const,
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: userService.getMe,
    select: (response) => response.data,
  })
}

export const useUsers = (params: GetUsersParams = {}, enabled = true) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.getUsers(params),
    enabled,
  })
}
