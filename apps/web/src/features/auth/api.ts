import { apiClient } from "@/services/api-client"
import type { LoginFormData, RegisterFormData } from "./schemas"
import type { LoginResponse } from "./types"

export const authService = {
  login: (data: LoginFormData) =>
    apiClient<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  register: (data: Pick<RegisterFormData, "email" | "password">) =>
    apiClient<{ status: string; message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),
}
