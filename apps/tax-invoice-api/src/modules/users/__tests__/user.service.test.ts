// Services
import { userService } from '@/container'

// Models
import { UserModel } from '@/models'

// Utils
import { NotFoundError } from '@/utils'

// Constants
import { ERROR_MESSAGE } from '@/constants'

// Types
import { UserRole, AuthProvider } from '@/types'

// Mock the entire models module
jest.mock('@/models', () => ({
  UserModel: {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  },
}))

describe('User Service', () => {
  const mockDate = new Date('2026-06-22T10:00:00.000Z')

  const mockUser = {
    email: 'test@example.com',
    role: UserRole.USER,
    createdAt: mockDate,
    toObject: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserByEmail', () => {
    it('should return user if found with properly formatted date', async () => {
      // Mock findByEmail inside repository
      ;(UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      })

      const result = await userService.getUserByEmail(mockUser.email)

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: mockUser.email })
      expect(result).toEqual({
        user: {
          email: mockUser.email,
          role: mockUser.role,
          createdAt: mockDate.toISOString(),
        },
      })
    })

    it('should throw not found error if user not found', async () => {
      ;(UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })

      await expect(
        userService.getUserByEmail('notfound@example.com'),
      ).rejects.toThrow(new NotFoundError(ERROR_MESSAGE.USER_NOT_FOUND))
    })
  })

  describe('findAll', () => {
    it('should return all users with pagination and serialized dates', async () => {
      const mockUsers = [
        { email: 'a@example.com', role: UserRole.USER, createdAt: mockDate },
        { email: 'b@example.com', role: UserRole.USER, createdAt: mockDate },
      ]

      // Standard builder pattern mocking for Mongoose query chaining
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers),
      }
      ;(UserModel.find as jest.Mock).mockReturnValue(mockQuery)
      ;(UserModel.countDocuments as jest.Mock).mockResolvedValue(2)

      const result = await userService.findAll({ page: 1, limit: 10 })

      expect(UserModel.find).toHaveBeenCalledWith(
        { role: { $ne: UserRole.ADMIN } },
        'email role createdAt',
      )

      // Expected result maps dates to ISO Strings inside repository.findAll
      expect(result.users).toEqual([
        {
          email: 'a@example.com',
          role: UserRole.USER,
          createdAt: mockDate.toISOString(),
        },
        {
          email: 'b@example.com',
          role: UserRole.USER,
          createdAt: mockDate.toISOString(),
        },
      ])
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })
  })

  describe('findOrCreateByAuth0', () => {
    const auth0Payload = {
      sub: 'auth0|123456',
      email: 'auth0user@example.com',
      name: 'Auth0 User',
    }

    it('should return existing user if found by email without creating a new record', async () => {
      const existingUser = {
        email: auth0Payload.email,
        role: UserRole.USER,
        authProvider: AuthProvider.LOCAL,
        createdAt: mockDate,
      }

      ;(UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingUser),
      })

      const result = await userService.findOrCreateByAuth0(auth0Payload)

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: auth0Payload.email,
      })
      expect(result).toEqual({
        email: existingUser.email,
        role: existingUser.role,
      })
      expect(UserModel.create).not.toHaveBeenCalled()
    })

    it('should call repository to create and return new user if not found', async () => {
      const createdUserRaw = {
        email: auth0Payload.email,
        role: UserRole.USER,
        authProvider: AuthProvider.AUTH0,
        authProviderId: auth0Payload.sub,
        createdAt: mockDate,
      }

      ;(UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })

      const mockCreatedDocument = {
        ...createdUserRaw,
        toObject: () => createdUserRaw,
      }
      ;(UserModel.create as jest.Mock).mockResolvedValue(mockCreatedDocument)

      const result = await userService.findOrCreateByAuth0(auth0Payload)

      expect(UserModel.create).toHaveBeenCalledWith({
        email: auth0Payload.email,
        role: UserRole.USER,
        authProvider: AuthProvider.AUTH0,
        authProviderId: auth0Payload.sub,
      })
      expect(result).toEqual({
        email: createdUserRaw.email,
        role: createdUserRaw.role,
      })
    })
  })
})
