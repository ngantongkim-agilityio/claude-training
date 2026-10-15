import { randomUUID } from 'crypto'
import { Request, Response, NextFunction } from 'express'

import { requestAsyncContext } from '@/utils/request-async-context'

export const requestContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  requestAsyncContext.run(
    {
      requestId: randomUUID(),
    },
    () => {
      next()
    },
  )
}
