import { Request, Response } from 'express'

// Utils
import { responseOk, parseRequest } from '@/utils'

// Constants
import { SUCCESS_MESSAGE } from '@/constants'

// Schemas
import { GetInvoicesV2QuerySchema } from './invoice.dto'

// Parent
import { InvoiceController } from './invoice.controller'

// Services
import type { InvoiceV2Service } from './invoice-v2.service'

export class InvoiceV2Controller extends InvoiceController {
  constructor(private readonly invoiceV2Service: InvoiceV2Service) {
    super(invoiceV2Service)
  }

  /**
   * V2: Override getInvoices to support minAmount/maxAmount filtering
   */
  override getInvoices = async (req: Request, res: Response): Promise<void> => {
    const {
      page,
      limit,
      search,
      status,
      from,
      to,
      sortBy,
      order,
      minAmount,
      maxAmount,
    } = parseRequest(GetInvoicesV2QuerySchema, req.query)

    const result = await this.invoiceV2Service.getInvoices({
      userEmail: req.currentUser!.email,
      role: req.currentUser!.role,
      page,
      limit,
      search,
      status,
      from,
      to,
      sortBy,
      order,
      minAmount,
      maxAmount,
    })

    responseOk(res, SUCCESS_MESSAGE.FETCH_SUCCESS, result)
  }
}
