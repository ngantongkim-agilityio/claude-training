import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'

import { createRegistry, buildOpenApiDocument } from '@/configs/swagger'

import { ROUTES } from '@/constants/route'

import { registerAuthSwagger } from '@/modules/auth/auth.swagger'
import { registerUserSwagger } from '@/modules/users/user.swagger'
import { registerInvoiceSwagger } from '@/modules/invoices/invoice.swagger'
import { registerReportSwagger } from '@/modules/reports/report.swagger'

export const swaggerRoutes = (router: Router) => {
  const registry = createRegistry()

  registerAuthSwagger(registry)
  registerUserSwagger(registry)
  registerInvoiceSwagger(registry)
  registerReportSwagger(registry)

  const document = buildOpenApiDocument({
    registry,
    version: '1.0.0',
    serverUrl: '/api/v1',
  })

  router.use(
    ROUTES.DOCS,
    ...swaggerUi.serveFiles(document),
    swaggerUi.setup(document),
  )
}
