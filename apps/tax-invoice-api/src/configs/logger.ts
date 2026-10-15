import { addColors, createLogger, format, transports } from 'winston'

import { requestAsyncContext } from '@/utils/request-async-context'

import { env, isProduction } from '@/configs/env'

const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const customColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'cyan',
  debug: 'gray',
}

addColors(customColors)

const injectRequestContext = format((info) => {
  const store = requestAsyncContext.getStore()

  if (store) {
    info.requestId = store.requestId
  }

  return info
})

const devFormat = format.combine(
  injectRequestContext(),
  format.colorize({ all: true }),
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, requestId, module, stack }) => {
    const requestPrefix = typeof requestId === 'string' ? `[${requestId}] ` : ''
    const modulePrefix = typeof module === 'string' ? `[${module}] ` : ''

    if (stack) {
      return `${timestamp} ${requestPrefix}${modulePrefix}${level}: ${stack}`
    }

    return `${timestamp} ${requestPrefix}${modulePrefix}${level}: ${message}`
  }),
)

const prodFormat = format.combine(
  injectRequestContext(),
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
)

export const logger = createLogger({
  levels: customLevels,
  level: env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  format: isProduction ? prodFormat : devFormat,
  transports: [
    new transports.Console({
      stderrLevels: ['error'],
    }),
  ],
})

/**
 * Create child logger for module/service
 *
 * Example:
 * const logger = createModuleLogger('AuthService')
 * logger.info('Login success')
 */
export const createModuleLogger = (module: string) => logger.child({ module })
