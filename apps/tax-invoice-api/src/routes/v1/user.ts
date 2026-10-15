import { Router } from 'express'

// Controllers
import { userController } from '@/container'

// Middlewares
import { authenticate, checkRole } from '@/middlewares'

// Types
import { UserRole } from '@/types/user'

// Constants
import { ROUTES } from '@/constants/route'

/**
 * User-related routes.
 *
 * @param router - Express router instance
 */
export const userRoutes = (router: Router) => {
  /**
   * @route GET /me
   * @desc Get current authenticated user info
   * @access Private (requires JWT)
   */
  router.get(ROUTES.USERS.ME, authenticate, userController.getMe)

  /**
   * @route GET /users
   * @desc Get all users or get a specific user by email query parameter
   * @access Admin
   */
  router.get(
    ROUTES.USERS.ROOT,
    authenticate,
    checkRole(UserRole.ADMIN),
    userController.getUsers,
  )
}
