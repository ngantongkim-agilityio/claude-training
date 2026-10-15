import { UserRole } from '@/types/user'

export interface CurrentUser {
  email: string
  role: UserRole
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser
    }
  }
}

export {}
