import { Document } from 'mongoose'

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum AuthProvider {
  LOCAL = 'local',
  AUTH0 = 'auth0',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface User extends Document {
  email: string
  password?: string
  role: UserRole
  status: UserStatus
  authProvider: AuthProvider
  authProviderId?: string
  createdAt: Date
  updatedAt: Date
}
