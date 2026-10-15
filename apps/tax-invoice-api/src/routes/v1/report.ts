import { Router } from 'express'

// Middlewares
import { authenticate } from '@/middlewares'

// Controllers
import { reportController } from '@/container'

// Constants
import { ROUTES } from '@/constants/route'

export const reportRoutes = (router: Router) => {
  /**
   * @route GET /reports/invoices
   * @description Retrieves invoice report with summary and filtered list.
   */
  router.get(
    ROUTES.REPORTS.INVOICES,
    authenticate,
    reportController.getInvoicesByFilter,
  )

  /**
   * @route POST /reports/invoices/pdf
   * @description Generates and returns a downloadable PDF of the invoice report.
   */
  router.post(
    ROUTES.REPORTS.PDF,
    authenticate,
    reportController.exportPdf,
  )

  /**
   * @route POST /reports/invoices/email
   * @description Queues a report email for async delivery via BullMQ.
   */
  router.post(
    ROUTES.REPORTS.EMAIL,
    authenticate,
    reportController.emailReport,
  )
}
