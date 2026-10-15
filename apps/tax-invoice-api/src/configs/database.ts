import mongoose from 'mongoose'

import { env } from './env'
import { logger } from './logger'

export class Database {
  private static instance: Database

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }

    return Database.instance
  }

  public async connect(): Promise<void> {
    try {
      if (!env.MONGODB_URI) {
        throw new Error('MONGODB_URI is missing')
      }

      await mongoose.connect(env.MONGODB_URI)

      logger.info('MongoDB connected successfully')
    } catch (error) {
      logger.error('MongoDB connection failed', {
        error: String(error),
      })

      process.exit(1)
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect()

      logger.info('MongoDB disconnected')
    } catch (error) {
      logger.error('MongoDB disconnection failed', {
        error: String(error),
      })
    }
  }
}
