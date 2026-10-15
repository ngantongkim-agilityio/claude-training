import type { NextFunction, Request, RequestHandler, Response } from 'express'

import { STATUS_CODE } from '@/constants'
import { responseCreated, responseOk } from '@/utils'

/**
 * Base Controller providing utility methods and centralized async error capturing for Express.
 */
export abstract class BaseController {
  /**
   * Sends a standard 200 OK HTTP response with custom messages and flexible payload data.
   */
  protected ok(res: Response, message: string, data?: any): void {
    responseOk(res, message, data)
  }

  /**
   * Sends a 201 Created HTTP response, commonly used after successful POST requests.
   */
  protected created(res: Response, message: string, data?: any): void {
    responseCreated(res, message, data)
  }

  /**
   * Sends a 204 No Content HTTP response.
   */
  protected noContent(res: Response): void {
    res.status(STATUS_CODE.NO_CONTENT).send()
  }

  /**
   * Wraps an asynchronous route handler to automatically capture unhandled rejections
   * and forward them gracefully to Express's global error-handling middleware.
   */
  protected asyncHandler(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  ): RequestHandler {
    return (req, res, next) => {
      Promise.resolve(handler(req, res, next)).catch(next)
    }
  }
}
