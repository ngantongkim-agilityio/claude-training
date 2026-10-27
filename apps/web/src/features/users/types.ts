export interface User {
  email: string
  role: "admin" | "user"
}

export interface GetMeResponse {
  status: string
  message: string
  data: User
}

export interface GetUsersParams {
  email?: string
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GetUsersListResponse {
  status: string
  message: string
  data: {
    users: User[]
    pagination: PaginationMeta
  }
}
