export interface AuthUser {
  email: string
  role: string
}

export interface LoginResponse {
  status: string
  message: string
  data: {
    token: string
    user: AuthUser
  }
}
