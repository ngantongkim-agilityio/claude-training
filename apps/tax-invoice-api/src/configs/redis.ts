import IORedis from 'ioredis'

import { env } from './env'
import { createModuleLogger } from './logger'

const logger = createModuleLogger('Redis')

// Redis lifecycle logs expose connection churn and outage windows that otherwise
// appear only as delayed or failed BullMQ jobs in production.
// Shared connection for Queue and QueueEvents (non-blocking producers and
// queue-wide event consumers).
// BullMQ requires maxRetriesPerRequest: null for workers/queues.
let sharedConnection: IORedis | null = null

const attachRedisConnectionLogging = (
  connection: IORedis,
  connectionRole: string,
): IORedis => {
  // Attach listeners once at construction so every queue-facing Redis client has
  // consistent diagnostics for reconnect loops, shutdowns, and auth/network errors.
  // Keep the pre-ready socket event at debug level because the ready event is the
  // operational signal that Redis can accept BullMQ commands.
  connection.on('connect', () => {
    logger.debug(`Redis ${connectionRole} connection opened`, {
      connectionRole,
    })
  })

  connection.on('ready', () => {
    logger.info(`Redis ${connectionRole} connection ready`, { connectionRole })
  })

  connection.on('reconnecting', () => {
    logger.warn(`Redis ${connectionRole} connection reconnecting`, {
      connectionRole,
    })
  })

  connection.on('end', () => {
    logger.info(`Redis ${connectionRole} connection ended`, { connectionRole })
  })

  connection.on('error', (error) => {
    logger.error(`Redis ${connectionRole} connection error`, {
      connectionRole,
      error: error.message,
      stack: error.stack,
    })
  })

  return connection
}

export const getSharedRedisConnection = (): IORedis => {
  if (!sharedConnection) {
    sharedConnection = attachRedisConnectionLogging(
      new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        retryStrategy: (times) => Math.min(times * 200, 5000),
      }),
      'shared',
    )
  }

  return sharedConnection
}

// Workers use a dedicated base connection because BullMQ duplicates it internally
// for blocking job fetch commands; sharing the API producer connection here would
// make startup and shutdown ownership harder to reason about.
export const createWorkerConnection = (): IORedis =>
  attachRedisConnectionLogging(
    new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 200, 5000),
    }),
    'worker',
  )

export const closeRedisConnections = async () => {
  if (sharedConnection) {
    await sharedConnection.quit()
    sharedConnection = null
  }
}
