import { Express } from 'express'

// Configs
import { env } from './env'
import { logger } from './logger'

export const boot = async (app: Express) => {
  const PORT = env.PORT

  app.listen(PORT, () => {
    logger.info(`Tax Invoices Manager API started`, {
      port: PORT,
      environment: env.NODE_ENV,
    })
  })
}
