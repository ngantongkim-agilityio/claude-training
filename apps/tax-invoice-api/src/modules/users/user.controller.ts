import type { Request, Response } from 'express'

// Constants
import { SUCCESS_MESSAGE } from '@/constants'

// Controllers
import { BaseController } from '@/core/base.controller'

// Utils
import { parseRequest } from '@/utils'

//Schemas
import { GetUsersQuerySchema } from './user.dto'

// Types
import type { UserService } from './user.service'

export class UserController extends BaseController {
  constructor(private readonly service: UserService) {
    super()
  }

  /**
   * Get current authenticated user (from token)
   *
   * @route GET /me
   * @access Authenticated users
   */
  getMe = this.asyncHandler(async (req: Request, res: Response) => {
    this.ok(res, SUCCESS_MESSAGE.FETCH_SUCCESS, {
      email: req.currentUser?.email,
      role: req.currentUser?.role,
    })
  })

  /**
   * Get users
   *
   * @route GET /users
   * @access Admin only
   *
   * Query params:
   * - email (optional): Get a specific user by email
   * - page (optional): Page number (default: 1)
   * - limit (optional): Number of items per page (default: 10)
   *
   * Examples:
   * - GET /users
   * - GET /users?page=1&limit=10
   * - GET /users?email=abc@gmail.com
   */
  getUsers = this.asyncHandler(async (req: Request, res: Response) => {
    const query = parseRequest(GetUsersQuerySchema, req.query)

    const users = await this.service.findAll(query)

    this.ok(res, SUCCESS_MESSAGE.FETCH_SUCCESS, users)
  })
}
