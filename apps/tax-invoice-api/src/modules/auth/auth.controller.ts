import { Request, Response } from 'express'

// Constants
import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constants'

// Utils
import {
  parseRequest,
  responseCreated,
  responseOk,
  runEffect,
  ConflictError,
  UnauthorizedError,
} from '@/utils'

// Schemas
import { LoginRequestSchema, RegisterRequestSchema } from './auth.dto'

// Services
import type { AuthService } from './auth.service'

export class AuthController {
  constructor(private readonly service: AuthService) {}

  /**
   * Register user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    const payload = parseRequest(RegisterRequestSchema, req.body)

    await runEffect(this.service.register(payload), (err) => {
      switch (err._tag) {
        case 'UserAlreadyExistsError':
          throw new ConflictError(ERROR_MESSAGE.USER_ALREADY_EXIST)

        case 'PasswordHashError':
        case 'UserCreationError':
          throw new Error(ERROR_MESSAGE.INTERNAL_ERROR)
      }
    })

    responseCreated(res, SUCCESS_MESSAGE.REGISTERED_SUCCESSFULLY)
  }

  /**
   * Login user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    const payload = parseRequest(LoginRequestSchema, req.body)

    const data = await runEffect(this.service.login(payload), () => {
      throw new UnauthorizedError(ERROR_MESSAGE.INVALID_CREDENTIALS)
    })

    responseOk(res, SUCCESS_MESSAGE.LOGIN_SUCCESS, data)
  }
}
