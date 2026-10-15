export const ERROR_MESSAGE = {
  // General
  SOME_THING_WENT_WRONG: 'Something went wrong',
  NOT_FOUND: 'Not found',
  INVALID_INPUT_DATA: 'Invalid input data provided',
  IS_REQUIRED: (name = 'field') => `${name} is required`,
  IS_INVALID: (name = 'field') => `${name} is invalid`,
  ALREADY_REGISTERED: (name = 'field') => `${name} already registered`,
  MUST_BE_NUMBER: (name = 'field') => `${name} must be a number`,
  MUST_BE_NON_NEGATIVE: (name = 'field') => `${name} cannot be negative`,
  PASSWORD_IS_INVALID:
    'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',

  // Auth
  VALIDATION_FAILED: 'Validation failed',
  UNEXPECTED_ERROR: 'Unexpected error occurred',
  INVALID_CREDENTIALS: 'Invalid credentials',
  FORBIDDEN: 'Access denied',
  UNAUTHORIZED: 'Unauthorized',
  INVALID_TOKEN: 'Invalid or missing token',

  // User
  USER_ALREADY_EXIST: 'User already exists',
  USER_NOT_FOUND: 'User not found',

  // Invoice
  INVALID_DATA: 'Invalid data provided',
  INVOICE_NOT_FOUND: 'Invoice not found',
  CANNOT_UPDATE: 'Cannot update status of finalized invoice',
  INVALID_STATUS: 'You are not allowed to change invoice to this status',
  CANNOT_DELETE: 'Cannot delete this invoice',

  INTERNAL_ERROR: 'Internal server error',
}

export const ERROR_NAME = {
  UNAUTHORIZED: 'UnauthorizedError',
}
