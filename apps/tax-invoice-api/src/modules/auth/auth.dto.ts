import { z } from 'zod'

// Constants
import { ERROR_MESSAGE } from '@/constants'

// Types
import { UserRole } from '@/types/user'

const emailSchema = z
  .string()
  .min(1, ERROR_MESSAGE.IS_REQUIRED('Email'))
  .pipe(z.email(ERROR_MESSAGE.IS_INVALID('Email')))

export const AuthUserSchema = z
  .object({
    email: z.email(),
    role: z.enum(UserRole),
  })
  .openapi('AuthUser')

export const RegisterRequestSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(8, ERROR_MESSAGE.PASSWORD_IS_INVALID),
  })
  .openapi('RegisterRequest')

export const LoginRequestSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, ERROR_MESSAGE.IS_REQUIRED('Password')),
  })
  .openapi('LoginRequest')

export const RegisterResponseSchema = z
  .object({
    user: AuthUserSchema,
  })
  .openapi('RegisterResponse')

export const LoginResponseSchema = z
  .object({
    token: z.string(),
    user: AuthUserSchema,
  })
  .openapi('LoginResponse')

export type RegisterRequestDTO = z.infer<typeof RegisterRequestSchema>

export type LoginRequestDTO = z.infer<typeof LoginRequestSchema>

export type AuthUserDTO = z.infer<typeof AuthUserSchema>

export type RegisterResponseDTO = z.infer<typeof RegisterResponseSchema>

export type LoginResponseDTO = z.infer<typeof LoginResponseSchema>
