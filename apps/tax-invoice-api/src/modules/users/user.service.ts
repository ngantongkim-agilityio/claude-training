// Configs
import { createModuleLogger } from '@/configs'

// Constants
import { ERROR_MESSAGE } from '@/constants'

// Services
import { BaseService } from '@/core'

// Utils
import { NotFoundError } from '@/utils'

// Types
import { AuthProvider, UserRole } from '@/types'
import type {
  Auth0UserResponseDTO,
  CreateUserDTO,
  FindOrCreateAuth0UserDTO,
  GetUserResponseDTO,
  GetUsersInputDTO,
  GetUsersResponseDTO,
  UpdateUserDTO,
  UserEntity,
} from './user.dto'
import type { UserRepository } from './user.repository'

const logger = createModuleLogger('UserService')

export class UserService extends BaseService<
  UserEntity,
  CreateUserDTO,
  UpdateUserDTO,
  GetUsersInputDTO,
  string,
  GetUsersResponseDTO
> {
  constructor(protected readonly userRepository: UserRepository) {
    super(userRepository)
  }

  /**
   * Find a user by email
   * @param email - Email string
   * @returns The user document
   * @throws NotFoundError if user not found
   */
  async getUserByEmail(email: string): Promise<GetUserResponseDTO> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      logger.warn('User not found', { email })

      throw new NotFoundError(ERROR_MESSAGE.USER_NOT_FOUND)
    }

    logger.info('User retrieved successfully', {
      email: user.email,
      role: user.role,
    })

    return {
      user: {
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    }
  }

  /**
   * Find an existing user by email or create a new one for Auth0 authentication.
   *
   * @param payload - Auth0 user info (sub, email, name)
   * @returns User email and role
   */
  async findOrCreateByAuth0(
    payload: FindOrCreateAuth0UserDTO,
  ): Promise<Auth0UserResponseDTO> {
    const { sub, email } = payload

    const existingUser = await this.userRepository.findByEmail(email)

    if (existingUser) {
      logger.info('Auth0 user found in database', {
        email,
      })

      return {
        email: existingUser.email,
        role: existingUser.role,
      }
    }

    const newUser = await this.create({
      email,
      role: UserRole.USER,
      authProvider: AuthProvider.AUTH0,
      authProviderId: sub,
    })

    logger.info('Auth0 user created', {
      email: newUser.email,
      role: newUser.role,
      authProviderId: sub,
    })

    return {
      email: newUser.email,
      role: newUser.role,
    }
  }
}
