// Constants
import { ERROR_MESSAGE, STATUS_CODE } from '@/constants'

/**
 * Custom application error class
 */
export class AppError extends Error {
  statusCode: number
  public errors?: Record<string, string>

  /**
   * Create a new AppError
   * @param message - A human-readable error message
   * @param statusCode - HTTP status code (default is 400 - Bad Request)
   * @param errors - Optional detailed field errors
   */
  constructor(
    message: string,
    statusCode: number,
    errors?: Record<string, string>,
  ) {
    super(message) // Call the parent constructor (Error)
    this.statusCode = statusCode
    this.errors = errors

    // Capture the stack trace from where this class was instantiated
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Error class for HTTP 400 Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, STATUS_CODE.BAD_REQUEST)
  }
}

/**
 * Error class for input validation failures (HTTP 400)
 * Typically used when multiple fields are invalid or fail validation.
 * The `errors` object provides detailed messages for each specific field.
 */
export class ValidationError extends BadRequestError {
  /**
   * A map of field names to error messages
   * Example: { email: "Invalid format", password: "Too short" }
   */
  public errors: Record<string, string>

  /**
   * Create a new ValidationError
   * @param errors - Object containing field-level validation messages
   * @param message - Top-level error message
   */
  constructor(errors: Record<string, string>, message: string) {
    super(message)
    this.errors = errors
  }
}

/**
 * Error class for authentication failures (HTTP 401 Unauthorized)
 */
export class UnauthorizedError extends AppError {
  /**
   * Create a new UnauthorizedError
   * @param message - Optional error message
   */
  constructor(message = ERROR_MESSAGE.UNAUTHORIZED) {
    super(message, STATUS_CODE.UNAUTHORIZED)
  }
}

/**
 * Error class for forbidden access (HTTP 403)
 */
export class ForbiddenError extends AppError {
  /**
   * Create a new ForbiddenError
   * @param message - Optional error message
   */
  constructor(message = ERROR_MESSAGE.FORBIDDEN) {
    super(message, STATUS_CODE.FORBIDDEN)
  }
}

/**
 * Error class for conflict situations (HTTP 409)
 * e.g. resource already exists
 */
export class ConflictError extends AppError {
  /**
   * Create a new ConflictError
   * @param message - error message
   */
  constructor(message: string) {
    super(message, STATUS_CODE.CONFLICT)
  }
}

/**
 * Error class for resources not found (HTTP 404)
 */
export class NotFoundError extends AppError {
  /**
   * Create a new NotFoundError
   * @param message - Optional error message (defaults to \"Not Found\")
   */
  constructor(message = ERROR_MESSAGE.NOT_FOUND) {
    super(message, STATUS_CODE.NOT_FOUND)
  }
}

/**
 * Error class for rate limit violations (HTTP 429)
 */
export class TooManyRequestsError extends AppError {
  /**
   * Create a new TooManyRequestsError
   * @param message - Optional error message
   */
  constructor(message = ERROR_MESSAGE.TOO_MANY_REQUESTS) {
    super(message, STATUS_CODE.TOO_MANY_REQUESTS)
  }
}
