import { Router } from 'express'

import { swaggerRoutes } from './swagger'
import { baseRoutes } from './base'
import { authRoutes } from './auth'
import { userRoutes } from './user'
import { invoiceRoutes } from './invoice'
import { reportRoutes } from './report'

const v1Router: Router = Router()

// Routes
swaggerRoutes(v1Router)
baseRoutes(v1Router)
authRoutes(v1Router)
userRoutes(v1Router)
invoiceRoutes(v1Router)
reportRoutes(v1Router)

export default v1Router
