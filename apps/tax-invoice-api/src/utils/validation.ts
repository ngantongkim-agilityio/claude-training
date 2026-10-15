import { ZodType } from 'zod'

// Constants
import { ERROR_MESSAGE } from '@/constants'

// Utils
import { ValidationError } from './error'

export const parseRequest = <T>(schema: ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new ValidationError(
      Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join('.'),
          issue.message,
        ]),
      ),
      ERROR_MESSAGE.VALIDATION_FAILED,
    )
  }

  return result.data
}
