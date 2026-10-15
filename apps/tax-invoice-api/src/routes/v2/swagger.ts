import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'

import { createRegistry, buildOpenApiDocument } from '@/configs/swagger'

import { ROUTES } from '@/constants/route'

import { registerInvoiceV2Swagger } from '@/modules/invoices/invoice-v2.swagger'

export const swaggerRoutes = (router: Router) => {
  const registry = createRegistry()

  registerInvoiceV2Swagger(registry)

  const document = buildOpenApiDocument({
    registry,
    version: '2.0.0',
    serverUrl: '/api/v2',
  })

  router.use(ROUTES.DOCS, ...swaggerUi.serveFiles(document), swaggerUi.setup(document))
}
