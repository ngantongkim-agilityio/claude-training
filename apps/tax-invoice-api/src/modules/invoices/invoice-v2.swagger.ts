import {
  OpenAPIRegistry,
  bearerAuth,
  unauthorized,
  successResponse,
} from '@/configs/swagger'

import {
  GetInvoicesV2QuerySchema,
  GetInvoicesResponseSchema,
} from '@/modules/invoices/invoice.dto'

export const registerInvoiceV2Swagger = (registry: OpenAPIRegistry) => {
  registry.registerPath({
    method: 'get',
    path: '/invoices',
    tags: ['Invoices'],
    security: [bearerAuth],

    summary: 'Get invoices with amount range filtering',
    description:
      'V2 endpoint that extends v1 with minAmount and maxAmount query parameters for filtering invoices by amount range.',

    request: {
      query: GetInvoicesV2QuerySchema,
    },

    responses: {
      200: {
        description: 'Invoices fetched',
        content: {
          'application/json': {
            schema: successResponse(GetInvoicesResponseSchema),
          },
        },
      },

      401: unauthorized(),
    },
  })
}
