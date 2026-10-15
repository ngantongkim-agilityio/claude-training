import { Request, Response, NextFunction } from 'express'

// Constants
import { ERROR_MESSAGE, STATUS_CODE, ERROR_NAME } from '@/constants'

// Middlewares
import { globalErrorHandler } from '@/middlewares'

// Utils
import { AppError } from '@/utils'

describe('globalErrorHandler', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {}
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    next = jest.fn()
  })

  // ================= JWT UNAUTHORIZED =================
  it('should handle unauthorized error by name', () => {
    const jwtError = {
      name: ERROR_NAME.UNAUTHORIZED,
      message: 'Invalid token',
      statusCode: 401,
    } as AppError

    globalErrorHandler(jwtError, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(STATUS_CODE.UNAUTHORIZED)
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: ERROR_MESSAGE.INVALID_TOKEN,
    })
  })

  // ================= APP ERROR =================
  it('should handle AppError with statusCode, message and errors', () => {
    const appError: AppError = {
      name: 'AppError',
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: 'Validation failed',
      errors: {
        amount: 'Amount must be > 0',
      },
    }

    globalErrorHandler(appError, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(STATUS_CODE.BAD_REQUEST)

    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Validation failed',
      errors: {
        amount: 'Amount must be > 0',
      },
    })
  })

  // ================= UNKNOWN ERROR =================
  it('should fallback to 500 when error is unknown', () => {
    const unknownError = {
      message: 'Something went wrong',
    } as any

    globalErrorHandler(unknownError, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(STATUS_CODE.INTERNAL_SERVER_ERROR)

    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Something went wrong',
    })
  })

  // ================= EMPTY ERROR =================
  it('should fallback to default message if message missing', () => {
    const error = {} as any

    globalErrorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(STATUS_CODE.INTERNAL_SERVER_ERROR)

    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: ERROR_MESSAGE.UNEXPECTED_ERROR,
    })
  })
})
