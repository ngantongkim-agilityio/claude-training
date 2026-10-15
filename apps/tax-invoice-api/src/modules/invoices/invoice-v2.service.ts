// Models
import { InvoiceModel } from '@/models'

// Configs
import { createModuleLogger } from '@/configs'

// Types
import {
  GetInvoicesV2RequestDTO,
  GetInvoicesResponseDTO,
  InvoiceResponseDTO,
} from './invoice.dto'

import { InvoiceStatus, UserRole } from '@/types'

// Utils
import { getDateRangeUTC } from '@/utils'

// Parent
import { InvoiceService } from './invoice.service'

const logger = createModuleLogger('InvoiceV2Service')

export class InvoiceV2Service extends InvoiceService {
  /**
   * V2: Override getInvoices to add amount range filtering (minAmount, maxAmount)
   */
  override async getInvoices(
    payload: GetInvoicesV2RequestDTO,
  ): Promise<GetInvoicesResponseDTO> {
    const {
      userEmail,
      role,
      page = 1,
      limit = 10,
      search,
      status,
      from,
      to,
      sortBy = 'createdAt',
      order = 'desc',
      minAmount,
      maxAmount,
    } = payload
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {
      isDeleted: { $ne: true },
      ...(role !== UserRole.ADMIN && { user: userEmail }),
    }

    if (search) {
      filter.invoiceNumber = { $regex: search, $options: 'i' }
    }

    if (status) {
      filter.status = status
    } else if (role === UserRole.ADMIN) {
      filter.status = { $ne: InvoiceStatus.DRAFT }
    }

    if (from && to) {
      filter.createdAt = getDateRangeUTC(from, to)
    } else if (from) {
      filter.createdAt = { $gte: new Date(from) }
    } else if (to) {
      filter.createdAt = { $lte: new Date(to) }
    }

    // V2: amount range filtering
    if (minAmount !== undefined || maxAmount !== undefined) {
      const amountFilter: Record<string, number> = {}
      if (minAmount !== undefined) {
        amountFilter.$gte = minAmount
      }
      if (maxAmount !== undefined) {
        amountFilter.$lte = maxAmount
      }
      filter.amount = amountFilter
    }

    const sortOption: Record<string, 1 | -1> = { [sortBy]: order === 'asc' ? 1 : -1 }

    const [invoices, total] = await Promise.all([
      InvoiceModel.find(filter)
        .select('-__v -isDeleted -_id')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean<InvoiceResponseDTO[]>(),
      InvoiceModel.countDocuments(filter),
    ])

    logger.info('Get invoices v2 successful', {
      userEmail,
      role,
      page,
      limit,
      total,
      count: invoices.length,
      minAmount,
      maxAmount,
    })

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}
