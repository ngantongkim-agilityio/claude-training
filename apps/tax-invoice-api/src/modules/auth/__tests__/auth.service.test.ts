// Services
import { authService } from '@/container'
import { Effect } from 'effect'

// Models
import { UserModel } from '@/models'

// Utils
import { hashPassword, comparePassword, generateToken } from '@/utils'

// Types
import { UserRole } from '@/types'

// Mocks
jest.mock('@/models', () => ({
  UserModel: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}))

jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils'),
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
}))

describe('Auth Service', () => {
  const mockUser = {
    email: 'test@example.com',
    password: 'hashed-password',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ================= REGISTER =================
  describe('register()', () => {
    it('should create a new user if email does not exist', async () => {
      ;(UserModel.findOne as jest.Mock).mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue(mockUser.password)
      ;(UserModel.create as jest.Mock).mockResolvedValue(mockUser)

      const result = await Effect.runPromise(
        authService.register({
          email: mockUser.email,
          password: '123456',
        }),
      )

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: mockUser.email,
      })

      expect(hashPassword).toHaveBeenCalledWith('123456')

      expect(UserModel.create).toHaveBeenCalledWith({
        email: mockUser.email,
        password: mockUser.password,
        role: UserRole.USER,
      })

      expect(result).toEqual({
        user: {
          email: mockUser.email,
          role: mockUser.role,
        },
      })
    })

    it('should fail with UserAlreadyExistsError if email already exists', async () => {
      ;(UserModel.findOne as jest.Mock).mockResolvedValue(mockUser)

      const exit = await Effect.runPromiseExit(
        authService.register({
          email: mockUser.email,
          password: '123456',
        }),
      )

      expect(exit._tag).toBe('Failure')
    })
  })

  // ================= LOGIN =================
  describe('login()', () => {
    it('should return token and user on successful login', async () => {
      ;(UserModel.findOne as jest.Mock).mockResolvedValue(mockUser)
      ;(comparePassword as jest.Mock).mockResolvedValue(true)
      ;(generateToken as jest.Mock).mockReturnValue('mock-token')

      const result = await Effect.runPromise(
        authService.login({
          email: mockUser.email,
          password: '123456',
        }),
      )

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: mockUser.email,
      })

      expect(comparePassword).toHaveBeenCalledWith('123456', mockUser.password)

      expect(generateToken).toHaveBeenCalledWith({
        email: mockUser.email,
        role: mockUser.role,
      })

      expect(result).toEqual({
        token: 'mock-token',
        user: {
          email: mockUser.email,
          role: mockUser.role,
        },
      })
    })

    it('should fail with InvalidCredentialsError if user not found', async () => {
      ;(UserModel.findOne as jest.Mock).mockResolvedValue(null)

      const exit = await Effect.runPromiseExit(
        authService.login({
          email: 'notfound@example.com',
          password: '123456',
        }),
      )

      expect(exit._tag).toBe('Failure')
    })

    it('should fail with InvalidCredentialsError if password is wrong', async () => {
      ;(UserModel.findOne as jest.Mock).mockResolvedValue(mockUser)
      ;(comparePassword as jest.Mock).mockResolvedValue(false)

      const exit = await Effect.runPromiseExit(
        authService.login({
          email: mockUser.email,
          password: 'wrongpass',
        }),
      )

      expect(exit._tag).toBe('Failure')
    })
  })
})
