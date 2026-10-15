import { z } from 'zod'

import {
  OpenAPIRegistry,
  bearerAuth,
  unauthorized,
  notFound,
  successResponse,
} from '@/configs/swagger'

import { UserRole } from '@/types'

import { GetUsersQuerySchema, GetUsersResponseSchema } from './user.dto'

export const registerUserSwagger = (registry: OpenAPIRegistry) => {
  registry.registerPath({
    method: 'get',
    path: '/users/me',
    tags: ['Users'],
    summary: 'Get current user',
    description: 'Get current authenticated user information',
    security: [bearerAuth],

    responses: {
      200: {
        description: 'Current user retrieved successfully',
        content: {
          'application/json': {
            schema: successResponse(
              z.object({
                email: z.email(),
                role: z.enum([UserRole.USER, UserRole.ADMIN]),
              }),
            ),
            example: {
              status: 'success',
              message: 'Data fetched successfully',
              data: {
                email: 'user@example.com',
                role: 'user',
              },
            },
          },
        },
      },

      401: unauthorized(),
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/users',
    tags: ['Users'],
    summary: 'Get users',
    description:
      'Get all users with pagination or get a specific user by email',
    security: [bearerAuth],

    request: {
      query: GetUsersQuerySchema,
    },

    responses: {
      200: {
        description: 'Users retrieved successfully',
        content: {
          'application/json': {
            schema: successResponse(GetUsersResponseSchema),
            example: {
              status: 'success',
              message: 'Data fetched successfully',
              data: {
                users: [
                  {
                    email: 'user1@example.com',
                    role: 'user',
                    createdAt: '2026-06-09T10:00:00.000Z',
                  },
                  {
                    email: 'user2@example.com',
                    role: 'user',
                    createdAt: '2026-06-08T10:00:00.000Z',
                  },
                ],
                pagination: {
                  page: 1,
                  limit: 10,
                  total: 2,
                  totalPages: 1,
                },
              },
            },
          },
        },
      },

      401: unauthorized(),

      404: notFound(),
    },
  })
}
