import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export { OpenAPIRegistry }

export const bearerAuth = {
  bearerAuth: [],
}

export const ErrorResponseSchema = z
  .object({
    status: z.literal('error'),
    message: z.string(),
    errors: z.record(z.string(), z.string()).optional(),
  })
  .openapi('ErrorResponse')

export const badRequest = () => ({
  description: 'Bad Request',
  content: {
    'application/json': {
      schema: ErrorResponseSchema,
    },
  },
})

export const unauthorized = () => ({
  description: 'Unauthorized',
  content: {
    'application/json': {
      schema: ErrorResponseSchema,
    },
  },
})

export const forbidden = () => ({
  description: 'Forbidden',
  content: {
    'application/json': {
      schema: ErrorResponseSchema,
    },
  },
})

export const conflict = () => ({
  description: 'Conflict',
  content: {
    'application/json': {
      schema: ErrorResponseSchema,
    },
  },
})

export const notFound = () => ({
  description: 'Not Found',
  content: {
    'application/json': {
      schema: ErrorResponseSchema,
    },
  },
})

export const successResponse = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    status: z.literal('success'),
    message: z.string(),
    data: schema,
  })

export const createRegistry = () => {
  const registry = new OpenAPIRegistry()

  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  })

  return registry
}

interface BuildDocumentOptions {
  registry: OpenAPIRegistry
  version: string
  serverUrl: string
}

export const buildOpenApiDocument = ({
  registry,
  version,
  serverUrl,
}: BuildDocumentOptions) => {
  const generator = new OpenApiGeneratorV31(registry.definitions)

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Tax Invoice Manager API',
      version,
      description: 'Tax Invoice Management System',
    },
    servers: [
      {
        url: serverUrl,
      },
    ],
  })
}
