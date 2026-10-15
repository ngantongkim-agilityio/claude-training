import { Effect, Exit, Cause, Chunk } from 'effect'

/**
 * Runs an Effect and maps failures to thrown errors for Express error middleware.
 * Uses Effect.runPromiseExit to avoid FiberFailure wrapping.
 */
export const runEffect = async <A, E>(
  effect: Effect.Effect<A, E, never>,
  mapError: (error: E) => never,
): Promise<A> => {
  const exit = await Effect.runPromiseExit(effect)

  if (Exit.isSuccess(exit)) {
    return exit.value
  }

  const failure = Cause.failureOption(exit.cause)
  if (failure._tag === 'Some') {
    mapError(failure.value)
  }

  const defects = Cause.defects(exit.cause)
  const first = Chunk.head(defects)
  if (first._tag === 'Some') {
    throw first.value
  }

  throw new Error('Unexpected Effect failure')
}
