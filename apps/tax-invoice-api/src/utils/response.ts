import { Response } from 'express'

// Constants
import { STATUS_CODE } from '@/constants'

/**
 * Sends a standard HTTP 200 OK success response.
 *
 * @param res - Express response object.
 * @param message - A human-readable success message.
 * @param data - Optional data payload (supports Objects, Arrays, or primitives).
 * @returns Express response with status 200 and a standardized JSON structure.
 */
export const responseOk = (
  res: Response,
  message: string,
  data?: any,
): void => {
  res.status(STATUS_CODE.OK).json({
    status: 'success',
    message,
    ...(data !== undefined ? { data } : {}),
  })
}

/**
 * Sends a standard HTTP 201 Created success response.
 *
 * @param res - Express response object.
 * @param message - A human-readable success message.
 * @param data - Optional data payload (supports Objects, Arrays, or primitives).
 * @returns Express response with status 201 and a standardized JSON structure.
 */
export const responseCreated = (
  res: Response,
  message: string,
  data?: any,
): void => {
  res.status(STATUS_CODE.CREATED).json({
    status: 'success',
    message,
    ...(data !== undefined ? { data } : {}),
  })
}
