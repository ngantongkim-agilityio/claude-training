import { Request, Response } from 'express'
import { Effect } from 'effect'

// Controllers
import { authController, authService } from '@/container'

// Constants
import { STATUS_CODE, SUCCESS_MESSAGE } from '@/constants'

// Types
import { UserRole } from '@/types'

// Utils
import { ValidationError, ConflictError, UnauthorizedError } from '@/utils'

// Errors
import { UserAlreadyExistsError, InvalidCredentialsError } from '../auth.errors'

const mockUser = {
  email: 'test@example.com',
  password: 'hashed',
  role: UserRole.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('AuthController', () => {
  let req: Partial<Request>
  let res: Response

  beforeEach(() => {
    req = { body: {} }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('register', () => {
    it('should return 201 on successful registration', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'StrongPass123!',
      }

      const spy = jest.spyOn(authService, 'register').mockReturnValueOnce(
        Effect.succeed({
          user: { email: mockUser.email, role: mockUser.role },
        }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      )

      await authController.register(req as Request, res)

      expect(spy).toHaveBeenCalledWith({
        email: req.body.email,
        password: req.body.password,
      })

      expect(res.status).toHaveBeenCalledWith(STATUS_CODE.CREATED)
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.REGISTERED_SUCCESSFULLY,
      })
    })

    it('should throw ValidationError when payload is invalid', async () => {
      req.body = { password: 'StrongPass123!' }

      await expect(
        authController.register(req as Request, res),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('should throw ConflictError when user already exists', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'StrongPass123!',
      }

      jest
        .spyOn(authService, 'register')
        .mockReturnValueOnce(
          Effect.fail(
            new UserAlreadyExistsError({ email: 'test@example.com' }),
          ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        )

      await expect(
        authController.register(req as Request, res),
      ).rejects.toBeInstanceOf(ConflictError)
    })
  })

  describe('login', () => {
    const mockLoginData = {
      token: 'mock.jwt.token',
      user: {
        email: 'test@example.com',
        role: UserRole.USER,
      },
    }

    it('should return 200 with token and user', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'StrongPass123!',
      }

      const spy = jest
        .spyOn(authService, 'login')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValueOnce(Effect.succeed(mockLoginData) as any)

      await authController.login(req as Request, res)

      expect(spy).toHaveBeenCalledWith({
        email: req.body.email,
        password: req.body.password,
      })

      expect(res.status).toHaveBeenCalledWith(STATUS_CODE.OK)
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.LOGIN_SUCCESS,
        data: mockLoginData,
      })
    })

    it('should throw UnauthorizedError when credentials are invalid', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'StrongPass123!',
      }

      jest
        .spyOn(authService, 'login')
        .mockReturnValueOnce(
          Effect.fail(
            new InvalidCredentialsError({ email: 'test@example.com' }),
          ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        )

      await expect(
        authController.login(req as Request, res),
      ).rejects.toBeInstanceOf(UnauthorizedError)
    })
  })
})
