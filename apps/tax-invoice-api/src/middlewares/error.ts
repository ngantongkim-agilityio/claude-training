import { Request, Response, NextFunction } from 'express'

// Configs
import { logger } from '@/configs'

// Constants
import { ERROR_MESSAGE, ERROR_NAME, STATUS_CODE } from '@/constants'

// Utils
import { AppError } from '@/utils'

/**
 * Global error handling middleware
 */
export const globalErrorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  const statusCode = error.statusCode ?? STATUS_CODE.INTERNAL_SERVER_ERROR

  const logPayload = {
    name: error.name,
    message: error.message,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errors: error.errors,
  }

  if (statusCode >= STATUS_CODE.INTERNAL_SERVER_ERROR) {
    logger.error('Unexpected error', logPayload)
  } else {
    logger.warn('Application error', logPayload)
  }

  if (error.name === ERROR_NAME.UNAUTHORIZED) {
    return res.status(STATUS_CODE.UNAUTHORIZED).json({
      status: 'error',
      message: ERROR_MESSAGE.INVALID_TOKEN,
    })
  }

  return res.status(statusCode).json({
    status: 'error',
    message: error.message ?? ERROR_MESSAGE.UNEXPECTED_ERROR,
    ...(error.errors && {
      errors: error.errors,
    }),
  })
}
