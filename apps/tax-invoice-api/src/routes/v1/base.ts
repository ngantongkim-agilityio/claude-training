import { Router } from 'express'

// Constants
import { ROUTES } from '@/constants/route'

export const baseRoutes = (router: Router) => {
  router.get(ROUTES.ROOT, (req, res) => {
    res.json({ status: 'Tax Invoices Manager API' })
  })
}
