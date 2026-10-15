import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'

// Configs
import { boot, Database, env } from '@/configs'

// Routes
import router from '@/routes'
import { bullBoardRoutes } from '@/routes/v1/bull-board'

// Middlewares
import {
  globalErrorHandler,
  requestContextMiddleware,
  httpLoggerMiddleware,
} from '@/middlewares'

// Constants
import { BASE_PREFIX } from '@/constants'

// Utils
import { TooManyRequestsError } from '@/utils'

// Connect database
const database = Database.getInstance()
database.connect()

const app = express()

// Security Headers
app.use(
  helmet({
    // Protect against clickjacking attacks
    frameguard: {
      action: 'deny',
    },

    // Prevent referrer information from being exposed
    referrerPolicy: {
      policy: 'no-referrer',
    },
  }),
)

// Configure Cross-Origin Resource Sharing (CORS)
// to allow requests from the trusted frontend application
app.use(
  cors({
    origin: env.CORS_ORIGIN,

    // Allow cookies and authorization headers
    // for authenticated cross-origin requests
    credentials: true,

    // Allow frontend to access rate limit information
    exposedHeaders: [
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset',
    ],

    // Cache successful preflight responses for 24 hours
    maxAge: 86400,
  }),
)

// Rate Limiting
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_req, _res, next) {
      next(new TooManyRequestsError())
    },
  }),
)

// Body parser
app.use(express.json())

// Cookie parser
app.use(cookieParser())

// Request Context
app.use(requestContextMiddleware)

// HTTP Logger
app.use(httpLoggerMiddleware)

// Routes
app.use(BASE_PREFIX, router)

// Mount the operational queue dashboard outside versioned API routes so its UI
// assets resolve cleanly while the route itself remains admin-protected.
bullBoardRoutes(app)

// Global error handler
app.use(globalErrorHandler)

boot(app)

export default app
