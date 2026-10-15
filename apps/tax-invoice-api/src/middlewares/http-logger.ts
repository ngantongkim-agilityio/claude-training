import { Request, Response, NextFunction } from 'express'

import { logger } from '@/configs/logger'

export const httpLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now()

  res.on('finish', () => {
    const durationMs = Date.now() - start

    logger.http(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`,
    )
  })

  next()
}
