import { Router } from 'express'

// Middlewares
import { authenticate, checkRole } from '@/middlewares'

// Controllers
import { invoiceV2Controller } from '@/container'

// Types
import { UserRole } from '@/types/user'

// Constants
import { ROUTES } from '@/constants/route'

export const invoiceRoutes = (router: Router) => {
  /**
   * @route POST /invoices
   * @desc Create a new invoice for the authenticated user
   * @route GET  /invoices
   * @desc Get list of invoices with amount range filtering (v2)
   *       - Users get their own invoices
   *       - Admins get all invoices
   *       - Supports minAmount/maxAmount query params
   */
  router
    .route(ROUTES.INVOICES.ROOT)
    .all(authenticate)
    .post(invoiceV2Controller.createInvoice)
    .get(invoiceV2Controller.getInvoices)

  /**
   * @route GET /invoices/:invoiceNumber
   * @desc Get detail of a specific invoice by invoiceNumber
   *
   * @route PATCH /invoices/:invoiceNumber
   * @desc Update status of an invoice
   *       - User submits (draft -> submitted)
   *       - Admin approves/rejects (submitted -> approved/rejected)
   *
   * @route PUT /invoices/:invoiceNumber
   * @desc Update invoice information (amount, tax, description)
   *       - Only invoice owner (non-admin)
   *       - Only if status is draft or submitted
   *       - If status is submitted, change is logged in `histories`
   *
   * @route DELETE /invoices/:invoiceNumber
   * @desc Delete an invoice
   *       - Only invoice owner (non-admin)
   *       - Only if status is draft/submitted
   */
  router
    .route(ROUTES.INVOICES.BY_NUMBER())
    .all(authenticate)
    .get(invoiceV2Controller.getInvoiceByNumber)
    .patch(invoiceV2Controller.updateInvoiceStatus)
    .put(
      checkRole(UserRole.USER),
      invoiceV2Controller.updateInvoiceInfo,
    )
    .delete(
      checkRole(UserRole.USER),
      invoiceV2Controller.deleteInvoice,
    )

  /**
   * @route GET /invoices/:invoiceNumber/history
   * @desc Get history logs for a specific invoice
   *       - Only the owner (user) or an admin can access this data
   */
  router
    .route(ROUTES.INVOICES.HISTORY())
    .all(authenticate)
    .get(invoiceV2Controller.getInvoiceHistory)
}
