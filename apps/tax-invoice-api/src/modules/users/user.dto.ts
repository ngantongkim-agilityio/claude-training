import { z } from 'zod'

// Schemas
import { PaginationSchema, PaginationMetaSchema } from '@/schemas/pagination'

// Types
import { AuthProvider, UserRole } from '@/types'

export const GetUsersQuerySchema = PaginationSchema.extend({
  email: z.string().max(254).optional(),
})

export const UserResponseSchema = z.object({
  email: z.email(),
  role: z.enum(UserRole),
  createdAt: z.string(),
})

export const GetUserResponseSchema = z.object({
  user: UserResponseSchema,
})

export const GetUsersResponseSchema = z.object({
  users: z.array(UserResponseSchema),
  pagination: PaginationMetaSchema,
})

export type GetUsersInputDTO = z.infer<typeof GetUsersQuerySchema>

export type UserResponseDTO = z.infer<typeof UserResponseSchema>

export type GetUserResponseDTO = z.infer<typeof GetUserResponseSchema>

export type GetUsersResponseDTO = z.infer<typeof GetUsersResponseSchema>

export type PaginationMetaDTO = z.infer<typeof PaginationMetaSchema>

export type FindOrCreateAuth0UserDTO = {
  sub: string
  email: string
  name?: string
}

export type Auth0UserResponseDTO = {
  email: string
  role: UserRole
}

export type UserEntity = {
  email: string
  role: UserRole
  createdAt: Date
  updatedAt?: Date

  authProvider?: AuthProvider
  authProviderId?: string
}

export type CreateUserDTO = {
  email: string
  role: UserRole
  authProvider: AuthProvider
  authProviderId: string
}

export type UpdateUserDTO = Partial<Pick<UserEntity, 'email' | 'role'>>
