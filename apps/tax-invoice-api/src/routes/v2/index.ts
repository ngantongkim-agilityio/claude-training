import { Router } from 'express'

import { swaggerRoutes } from './swagger'
import { invoiceRoutes } from './invoice'

const v2Router: Router = Router()

// Routes
swaggerRoutes(v2Router)
invoiceRoutes(v2Router)

export default v2Router
