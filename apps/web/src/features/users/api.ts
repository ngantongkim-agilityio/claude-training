import { apiClient } from "@/services/api-client"
import type {
  GetMeResponse,
  GetUsersParams,
  GetUsersListResponse,
} from "./types"

export const userService = {
  getMe: () => apiClient<GetMeResponse>("/me"),

  getUsers: (params: GetUsersParams = {}) => {
    const searchParams = new URLSearchParams()

    if (params.email) searchParams.set("email", params.email)
    if (params.page) searchParams.set("page", String(params.page))
    if (params.limit) searchParams.set("limit", String(params.limit))

    const query = searchParams.toString()
    return apiClient<GetUsersListResponse>(`/users${query ? `?${query}` : ""}`)
  },
}
