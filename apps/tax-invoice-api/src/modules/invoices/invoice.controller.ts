import { Request, Response } from 'express'

import { BaseController } from '@/core'

// Constants
import { SUCCESS_MESSAGE, ERROR_MESSAGE } from '@/constants'

// Utils
import {
  ForbiddenError,
  isInvoiceStatus,
  ValidationError,
  parseRequest,
} from '@/utils'

// DTOs
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  UpdateInvoiceStatusSchema,
  InvoiceParamsSchema,
  GetInvoicesQuerySchema,
} from './invoice.dto'

// Types
import { UserRole } from '@/types'
import type { InvoiceService } from './invoice.service'

export class InvoiceController extends BaseController {
  constructor(private readonly service: InvoiceService) {
    super()
  }

  /**
   * Create a new invoice for the authenticated user.
   * @route POST /invoices
   */
  createInvoice = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (req.currentUser!.role === UserRole.ADMIN) {
        throw new ForbiddenError(ERROR_MESSAGE.FORBIDDEN)
      }

      const { amount, tax, description } = parseRequest(
        CreateInvoiceSchema,
        req.body,
      )

      const invoice = await this.service.createInvoice({
        user: req.currentUser!.email,
        amount,
        tax,
        description,
      })

      this.created(res, SUCCESS_MESSAGE.CREATE_SUCCESS, invoice)
    },
  )

  /**
   * Get a list of invoices with pagination filters.
   * @route GET /invoices
   */
  getInvoices = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const query = parseRequest(GetInvoicesQuerySchema, req.query)

      const result = await this.service.getInvoices({
        userEmail: req.currentUser!.email,
        role: req.currentUser!.role,
        ...query,
      })

      this.ok(res, SUCCESS_MESSAGE.FETCH_SUCCESS, result)
    },
  )

  /**
   * Get detail of a specific invoice by invoiceNumber.
   * @route GET /invoices/:invoiceNumber
   */
  getInvoiceByNumber = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { invoiceNumber } = parseRequest(InvoiceParamsSchema, req.params)

      const result = await this.service.getInvoiceByNumber({
        invoiceNumber,
        userEmail: req.currentUser!.email,
        role: req.currentUser!.role,
      })

      this.ok(res, SUCCESS_MESSAGE.FETCH_SUCCESS, {
        invoice: result,
      })
    },
  )

  /**
   * Update invoice status across lifecycle state pipelines.
   * @route PATCH /invoices/:invoiceNumber
   */
  updateInvoiceStatus = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { status, reason, comment } = parseRequest(
        UpdateInvoiceStatusSchema,
        req.body,
      )

      if (!status || !isInvoiceStatus(status)) {
        throw new ValidationError({}, ERROR_MESSAGE.INVALID_DATA)
      }

      const { invoiceNumber } = parseRequest(InvoiceParamsSchema, req.params)

      const result = await this.service.updateInvoiceStatus({
        invoiceNumber,
        status,
        reason,
        comment,
        userEmail: req.currentUser!.email,
        role: req.currentUser!.role,
      })

      this.ok(res, SUCCESS_MESSAGE.UPDATE_SUCCESS, result)
    },
  )

  /**
   * Update internal info configurations (amount, tax, description).
   * @route PUT /invoices/:invoiceNumber
   */
  updateInvoiceInfo = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const payload = parseRequest(UpdateInvoiceSchema, req.body)
      const { invoiceNumber } = parseRequest(InvoiceParamsSchema, req.params)

      const result = await this.service.updateInvoiceInfo({
        invoiceNumber,
        userEmail: req.currentUser!.email,
        ...payload,
      })

      this.ok(res, SUCCESS_MESSAGE.UPDATE_SUCCESS, result)
    },
  )

  /**
   * Soft delete an active draft/submitted invoice configuration instance.
   * @route DELETE /invoices/:invoiceNumber
   */
  deleteInvoice = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { invoiceNumber } = parseRequest(InvoiceParamsSchema, req.params)

      const result = await this.service.deleteInvoice({
        invoiceNumber,
        userEmail: req.currentUser!.email,
      })

      this.ok(res, SUCCESS_MESSAGE.DELETE_SUCCESS, result)
    },
  )

  /**
   * Get historical audit trail changes tracked for an item.
   * @route GET /invoices/:invoiceNumber/history
   */
  getInvoiceHistory = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { invoiceNumber } = parseRequest(InvoiceParamsSchema, req.params)

      const result = await this.service.getInvoiceHistory({
        invoiceNumber,
        userEmail: req.currentUser!.email,
        role: req.currentUser!.role,
      })

      this.ok(res, SUCCESS_MESSAGE.FETCH_SUCCESS, result)
    },
  )
}
