import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'debug'])
    .default('debug'),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
  AUTH0_DOMAIN: z.string().optional(),
  AUTH0_AUDIENCE: z.string().optional(),
  APP_TIMEZONE: z.string().default('Asia/Ho_Chi_Minh'),

  // Redis (BullMQ)
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // SMTP (Email)
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@tax-invoice.local'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(z.flattenError(parsed.error))

  process.exit(1)
}

export const env = parsed.data

export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'
