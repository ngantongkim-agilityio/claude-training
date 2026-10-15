import { Effect } from 'effect'

// Models
import { UserModel } from '@/models'

// Configs
import { createModuleLogger } from '@/configs'

// Utils
import { hashPassword, comparePassword, generateToken } from '@/utils'

// Types
import { UserRole } from '@/types/user'

// DTOs
import type {
  RegisterRequestDTO,
  LoginRequestDTO,
  RegisterResponseDTO,
  LoginResponseDTO,
} from './auth.dto'

// Errors
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  PasswordHashError,
  UserCreationError,
} from './auth.errors'

const logger = createModuleLogger('AuthService')

export class AuthService {
  /**
   * Register new user
   */
  register = (
    payload: RegisterRequestDTO,
  ): Effect.Effect<
    RegisterResponseDTO,
    UserAlreadyExistsError | PasswordHashError | UserCreationError
  > => {
    const { email, password } = payload

    return Effect.gen(function* () {
      // 1. check existing user
      const existingUser = yield* Effect.tryPromise({
        try: () => UserModel.findOne({ email }),
        catch: (cause) => new UserCreationError({ cause }),
      })

      if (existingUser) {
        logger.warn('Register failed - user already exists', { email })
        return yield* Effect.fail(new UserAlreadyExistsError({ email }))
      }

      // 2. hash password
      const hashedPassword = yield* Effect.tryPromise({
        try: () => hashPassword(password),
        catch: (cause) => new PasswordHashError({ cause }),
      })

      // 3. create user
      const newUser = yield* Effect.tryPromise({
        try: () =>
          UserModel.create({
            email,
            password: hashedPassword,
            role: UserRole.USER,
          }),
        catch: (cause) => new UserCreationError({ cause }),
      })

      logger.info('User registered successfully', {
        email: newUser.email,
        role: newUser.role,
      })

      return {
        user: {
          email: newUser.email,
          role: newUser.role,
        },
      }
    })
  }

  /**
   * Login user
   */
  login = (
    payload: LoginRequestDTO,
  ): Effect.Effect<LoginResponseDTO, InvalidCredentialsError> => {
    const { email, password } = payload

    return Effect.gen(function* () {
      // 1. fetch user
      const user = yield* Effect.tryPromise({
        try: () => UserModel.findOne({ email }),
        catch: () => new InvalidCredentialsError({ email }),
      })

      if (!user) {
        logger.warn('Login failed - user not found', { email })
        return yield* Effect.fail(new InvalidCredentialsError({ email }))
      }

      if (!user.password) {
        logger.warn('Login failed - missing password', { email })
        return yield* Effect.fail(new InvalidCredentialsError({ email }))
      }

      // 2. compare password
      const matched = yield* Effect.tryPromise({
        try: () => comparePassword(password, user.password!),
        catch: () => new InvalidCredentialsError({ email }),
      })

      if (!matched) {
        logger.warn('Login failed - invalid password', { email })
        return yield* Effect.fail(new InvalidCredentialsError({ email }))
      }

      // 3. generate token
      const token = Effect.sync(() =>
        generateToken({
          email: user.email,
          role: user.role,
        }),
      )

      const jwt = yield* token

      logger.info('Login successful', {
        email: user.email,
        role: user.role,
      })

      return {
        token: jwt,
        user: {
          email: user.email,
          role: user.role,
        },
      }
    })
  }
}
