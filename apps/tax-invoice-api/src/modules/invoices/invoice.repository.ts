import { InvoiceModel } from '@/models'
import { InvoiceHistory, InvoiceStatus, UserRole } from '@/types'
import {
  escapeRegExp,
  getDateRangeUTC,
  toInvoiceHistoryResponse,
} from '@/utils'
import type { BaseRepository } from '@/core/base.repository'
import type {
  InvoiceEntity,
  GetInvoicesRequestDTO,
  GetInvoicesResponseDTO,
} from './invoice.dto'

/**
 * Repository handling all direct Database Access Object (DAO) mutations for Invoices.
 * Implements the standard BaseRepository interface to decoupling data source mechanisms.
 */
export class InvoiceRepository implements BaseRepository<
  InvoiceEntity,
  Omit<InvoiceEntity, 'createdAt' | 'updatedAt'>, // Structure used for creation
  Partial<InvoiceEntity>, // Structure used for updates
  GetInvoicesRequestDTO, // Query filter parameters
  string, // Identity key type (invoiceNumber)
  GetInvoicesResponseDTO // Overridden query array layout
> {
  /**
   * Finds an active, non-deleted invoice instance by its distinct number.
   * Leverages assertion to shield outer layers from internal Hydrated Mongoose specifics.
   */
  async findById(invoiceNumber: string): Promise<InvoiceEntity | null> {
    const invoice = await InvoiceModel.findOne({
      invoiceNumber,
      isDeleted: { $ne: true },
    }).lean()

    if (!invoice) return null
    return invoice as unknown as InvoiceEntity
  }

  /**
   * Retrieves a mutable raw Mongoose Document state.
   * Essential for transactional operations needing direct atomic `.save()` capability.
   */
  async findByNumberRaw(invoiceNumber: string): Promise<any | null> {
    return InvoiceModel.findOne({ invoiceNumber })
  }

  /**
   * Compiles paginated rows matching precise identity visibility scopes.
   * Maps timestamp instances cleanly into expected JSON layout strings.
   */
  async findAll(
    options: GetInvoicesRequestDTO,
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
    } = options

    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {
      isDeleted: { $ne: true },
      ...(role !== UserRole.ADMIN && { user: userEmail }),
    }

    if (search) {
      // Escape regex metacharacters so search is a literal substring match
      filter.invoiceNumber = { $regex: escapeRegExp(search), $options: 'i' }
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

    const direction = order === 'asc' ? 1 : -1
    // Amounts tie often, so add an _id tiebreaker to keep skip/limit pagination stable.
    // Timestamp sorts are left as-is so they can keep using the { createdAt: -1 } index.
    const sortOption: Record<string, 1 | -1> = {
      [sortBy]: direction,
      ...(sortBy === 'amount' && { _id: direction }),
    }

    const [invoices, total] = await Promise.all([
      InvoiceModel.find(filter)
        .select('-__v -isDeleted -_id')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean<any[]>(),
      InvoiceModel.countDocuments(filter),
    ])

    return {
      invoices: invoices.map((invoice) => ({
        ...invoice,
        createdAt: invoice.createdAt?.toISOString(),
        updatedAt: invoice.updatedAt?.toISOString(),
        histories: invoice.histories?.map(toInvoiceHistoryResponse),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Persists a new structured dataset. Cleanses output to ensure zero unhandled parameters.
   */
  async create(
    data: Omit<InvoiceEntity, 'createdAt' | 'updatedAt'>,
  ): Promise<InvoiceEntity> {
    const invoice = await InvoiceModel.create(data)
    return invoice.toObject() as unknown as InvoiceEntity
  }

  /**
   * Safely merges individual updates with an active database entry.
   */
  async update(
    invoiceNumber: string,
    data: Partial<InvoiceEntity>,
  ): Promise<InvoiceEntity | null> {
    const invoice = await InvoiceModel.findOneAndUpdate(
      { invoiceNumber },
      data,
      {
        new: true,
      },
    ).lean()

    if (!invoice) return null
    return invoice as unknown as InvoiceEntity
  }

  /**
   * Flags an existing object instance as deleted without destroying the structural log.
   * An optional history event is appended in the same update, so the flag and its audit
   * entry are written together. Matching only live invoices keeps a concurrent second
   * delete from appending a duplicate deleted event.
   */
  async softDelete(
    invoiceNumber: string,
    event?: InvoiceHistory,
  ): Promise<InvoiceEntity | null> {
    const invoice = await InvoiceModel.findOneAndUpdate(
      { invoiceNumber, isDeleted: { $ne: true } },
      {
        $set: { isDeleted: true },
        ...(event && { $push: { histories: event } }),
      },
      { new: true },
    ).lean()

    if (!invoice) return null
    return invoice as unknown as InvoiceEntity
  }
}
