import { Router } from 'express'

// Controllers
import { authController } from '@/container'

// Constants
import { ROUTES } from '@/constants/route'

export const authRoutes = (router: Router) => {
  router.post(ROUTES.AUTH.REGISTER, authController.register)
  router.post(ROUTES.AUTH.LOGIN, authController.login)
}
