import {
  OpenAPIRegistry,
  badRequest,
  conflict,
  unauthorized,
} from '@/configs/swagger'

import {
  RegisterRequestSchema,
  LoginRequestSchema,
  RegisterResponseSchema,
  LoginResponseSchema,
} from './auth.dto'

export const registerAuthSwagger = (registry: OpenAPIRegistry) => {
  registry.registerPath({
    method: 'post',
    path: '/auth/register',
    tags: ['Auth'],
    summary: 'Register a new user',
    description: 'Create a new user account',
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: RegisterRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'User registered successfully',
        content: {
          'application/json': {
            schema: RegisterResponseSchema,
            example: {
              user: {
                email: 'user@example.com',
                role: 'user',
              },
            },
          },
        },
      },
      400: badRequest(),
      409: conflict(),
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Auth'],
    summary: 'Login user',
    description: 'Authenticate user and return JWT token',
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: LoginRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Login successful',
        content: {
          'application/json': {
            schema: LoginResponseSchema,
            example: {
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              user: {
                email: 'user@example.com',
                role: 'user',
              },
            },
          },
        },
      },
      400: badRequest(),
      401: unauthorized(),
    },
  })
}
