import { Data } from 'effect'

export class UserAlreadyExistsError extends Data.TaggedError(
  'UserAlreadyExistsError',
)<{
  readonly email: string
}> {}

export class InvalidCredentialsError extends Data.TaggedError(
  'InvalidCredentialsError',
)<{
  readonly email: string
}> {}

export class PasswordHashError extends Data.TaggedError('PasswordHashError')<{
  readonly cause: unknown
}> {}

export class UserCreationError extends Data.TaggedError('UserCreationError')<{
  readonly cause: unknown
}> {}

export class TokenGenerationError extends Data.TaggedError(
  'TokenGenerationError',
)<{
  readonly cause: unknown
}> {}
