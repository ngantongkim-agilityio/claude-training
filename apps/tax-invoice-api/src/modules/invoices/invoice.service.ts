import { BaseService } from '@/core'

// Configs
import { createModuleLogger } from '@/configs'

// Constants
import { ERROR_MESSAGE } from '@/constants'

// Utils
import {
  ConflictError,
  ForbiddenError,
  generateInvoiceNumber,
  NotFoundError,
  toInvoiceHistoryResponse,
  trackInvoiceChanges,
} from '@/utils'

// Types
import {
  InvoiceEventType,
  InvoiceHistory,
  InvoiceStatus,
  UserRole,
} from '@/types'
import type {
  InvoiceEntity,
  CreateInvoiceRequestDTO,
  GetInvoiceRequestDTO,
  GetInvoicesRequestDTO,
  GetInvoicesResponseDTO,
  InvoiceResponseDTO,
  UpdateInvoiceStatusRequestDTO,
  DeleteInvoiceRequestDTO,
  GetInvoiceHistoryRequestDTO,
  UpdateInvoiceInfoRequestDTO,
  UpdateInvoiceInfoResponseDTO,
  UpdateInvoiceStatusResponseDTO,
  DeleteInvoiceResponseDTO,
  GetInvoiceHistoryResponseDTO,
} from './invoice.dto'
import type { InvoiceRepository } from './invoice.repository'

const logger = createModuleLogger('InvoiceService')

// Event recorded for each status an allowed transition can reach (never draft)
const STATUS_EVENT: Partial<Record<InvoiceStatus, InvoiceEventType>> = {
  [InvoiceStatus.SUBMITTED]: InvoiceEventType.SUBMITTED,
  [InvoiceStatus.APPROVED]: InvoiceEventType.APPROVED,
  [InvoiceStatus.REJECTED]: InvoiceEventType.REJECTED,
}

export class InvoiceService extends BaseService<
  InvoiceEntity,
  CreateInvoiceRequestDTO,
  any, // Handled flexibly via custom orchestration methods
  GetInvoicesRequestDTO,
  string,
  GetInvoicesResponseDTO
> {
  constructor(protected readonly invoiceRepository: InvoiceRepository) {
    super(invoiceRepository)
  }

  /**
   * Hook to automatically format and populate structural entities before creation.
   */
  protected override beforeCreate(
    data: CreateInvoiceRequestDTO,
  ): Omit<InvoiceEntity, 'createdAt' | 'updatedAt'> {
    return {
      invoiceNumber: generateInvoiceNumber(),
      user: data.user,
      amount: data.amount,
      tax: data.tax,
      description: data.description,
      status: InvoiceStatus.DRAFT,
      isDeleted: false,
      // Every invoice's audit trail starts with who created it
      histories: [
        {
          eventType: InvoiceEventType.CREATED,
          actor: data.user,
          createdAt: new Date(),
        },
      ],
    }
  }

  /**
   * Creates an invoice and maps the domain entity result to CreateInvoiceResponseDTO.
   */
  async createInvoice(payload: CreateInvoiceRequestDTO): Promise<any> {
    const invoice = await this.create(payload)
    logger.info('Create invoice successful', {
      invoiceNumber: invoice.invoiceNumber,
      user: invoice.user,
      status: invoice.status,
    })
    return {
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
    }
  }

  /**
   * Fetches paginated invoices matching identity authorization filters.
   */
  async getInvoices(
    payload: GetInvoicesRequestDTO,
  ): Promise<GetInvoicesResponseDTO> {
    const result = await this.findAll(payload)
    logger.info('Get invoices successful', {
      userEmail: payload.userEmail,
      role: payload.role,
      count: result.invoices.length,
    })
    return result
  }

  /**
   * Retrieves detail logs of a specific invoice with multi-tenant isolation rules.
   */
  async getInvoiceByNumber(
    payload: GetInvoiceRequestDTO,
  ): Promise<InvoiceResponseDTO> {
    const { invoiceNumber, userEmail, role } = payload

    const invoice = await this.invoiceRepository.findById(invoiceNumber)

    if (!invoice) {
      logger.warn('Get invoice failed - invoice not found', { invoiceNumber })
      throw new NotFoundError(ERROR_MESSAGE.INVOICE_NOT_FOUND)
    }

    if (role !== UserRole.ADMIN && invoice.user !== userEmail) {
      logger.warn('Get invoice failed - forbidden', {
        invoiceNumber,
        userEmail,
        role,
      })
      throw new ForbiddenError(ERROR_MESSAGE.FORBIDDEN)
    }

    return {
      ...invoice,
      createdAt: invoice.createdAt?.toISOString(),
      updatedAt: invoice.updatedAt?.toISOString(),
      histories: (invoice.histories ?? []).map(toInvoiceHistoryResponse),
    } as unknown as InvoiceResponseDTO
  }

  /**
   * Handles multi-stage invoice status workflow validations.
   */
  async updateInvoiceStatus(
    payload: UpdateInvoiceStatusRequestDTO,
  ): Promise<UpdateInvoiceStatusResponseDTO> {
    const { invoiceNumber, userEmail, role, status, reason, comment } = payload

    const invoice = await this.invoiceRepository.findByNumberRaw(invoiceNumber)

    if (!invoice || invoice.isDeleted) {
      logger.warn('Update invoice status failed - invoice not found', {
        invoiceNumber,
      })
      throw new NotFoundError(ERROR_MESSAGE.INVOICE_NOT_FOUND)
    }

    if (role !== UserRole.ADMIN && invoice.user !== userEmail) {
      logger.warn('Update invoice status failed - forbidden', {
        invoiceNumber,
        userEmail,
        role,
      })
      throw new ForbiddenError(ERROR_MESSAGE.FORBIDDEN)
    }

    const currentStatus = invoice.status

    if (
      currentStatus === InvoiceStatus.APPROVED ||
      currentStatus === InvoiceStatus.REJECTED
    ) {
      logger.warn('Update invoice status failed - invoice cannot be updated', {
        invoiceNumber,
        currentStatus,
      })
      throw new ConflictError(ERROR_MESSAGE.CANNOT_UPDATE)
    }

    const isUserSubmitting =
      role === UserRole.USER &&
      currentStatus === InvoiceStatus.DRAFT &&
      status === InvoiceStatus.SUBMITTED
    const isAdminChanging =
      role === UserRole.ADMIN &&
      currentStatus === InvoiceStatus.SUBMITTED &&
      [InvoiceStatus.APPROVED, InvoiceStatus.REJECTED].includes(status)

    if (!isUserSubmitting && !isAdminChanging) {
      logger.warn('Update invoice status failed - invalid status transition', {
        invoiceNumber,
        currentStatus,
        newStatus: status,
        role,
      })
      throw new ForbiddenError(ERROR_MESSAGE.INVALID_STATUS)
    }

    // Every status change is recorded with who made it; an admin's decision also
    // keeps why (a rejection reason, or an approval comment when one is given).
    const event: InvoiceHistory = {
      eventType: STATUS_EVENT[status],
      actor: userEmail,
      ...(status === InvoiceStatus.REJECTED && reason && { reason }),
      ...(status === InvoiceStatus.APPROVED && comment && { comment }),
      createdAt: new Date(),
    }

    const updated = await this.invoiceRepository.updateStatus(
      invoiceNumber,
      currentStatus,
      status,
      event,
    )

    // Another request changed the status after we read it, so this decision is stale
    if (!updated) {
      logger.warn(
        'Update invoice status failed - status changed concurrently',
        {
          invoiceNumber,
          expectedStatus: currentStatus,
          newStatus: status,
        },
      )
      throw new ConflictError(ERROR_MESSAGE.CANNOT_UPDATE)
    }

    logger.info('Update invoice status successful', {
      invoiceNumber,
      previousStatus: currentStatus,
      newStatus: status,
      updatedBy: userEmail,
      role,
    })

    return {
      invoiceNumber: updated.invoiceNumber,
      status: updated.status,
    }
  }

  /**
   * Mutates explicit tracking parameters and logs variations to internal histories.
   */
  async updateInvoiceInfo(
    payload: UpdateInvoiceInfoRequestDTO,
  ): Promise<UpdateInvoiceInfoResponseDTO> {
    const { invoiceNumber, userEmail, ...updates } = payload

    const invoice = await this.invoiceRepository.findByNumberRaw(invoiceNumber)

    if (!invoice || invoice.isDeleted) {
      logger.warn('Update invoice info failed - invoice not found', {
        invoiceNumber,
      })
      throw new NotFoundError(ERROR_MESSAGE.INVOICE_NOT_FOUND)
    }

    if (invoice.user !== userEmail) {
      logger.warn('Update invoice info failed - forbidden', {
        invoiceNumber,
        userEmail,
      })
      throw new ForbiddenError(ERROR_MESSAGE.FORBIDDEN)
    }

    const currentStatus = invoice.status

    if (
      currentStatus === InvoiceStatus.APPROVED ||
      currentStatus === InvoiceStatus.REJECTED
    ) {
      logger.warn('Update invoice info failed - invoice cannot be updated', {
        invoiceNumber,
        currentStatus,
      })
      throw new ConflictError(ERROR_MESSAGE.CANNOT_UPDATE)
    }

    const { updatedInvoice, changes } = trackInvoiceChanges(invoice, updates)

    Object.assign(invoice, updatedInvoice)

    if (
      currentStatus === InvoiceStatus.SUBMITTED &&
      Object.keys(changes).length > 0
    ) {
      invoice.histories?.push({
        eventType: InvoiceEventType.EDITED,
        actor: userEmail,
        changes,
        createdAt: new Date(),
      })
    }

    await invoice.save()

    logger.info('Update invoice info successful', {
      invoiceNumber,
      updatedBy: userEmail,
      updatedFields: Object.keys(changes),
    })

    return {
      invoiceNumber: invoice.invoiceNumber,
      updatedFields: Object.keys(changes),
    }
  }

  /**
   * Soft deletes an active instance.
   */
  async deleteInvoice(
    payload: DeleteInvoiceRequestDTO,
  ): Promise<DeleteInvoiceResponseDTO> {
    const { invoiceNumber, userEmail } = payload

    const invoice = await this.invoiceRepository.findById(invoiceNumber)

    if (!invoice) {
      logger.warn('Delete invoice failed - invoice not found', {
        invoiceNumber,
      })
      throw new NotFoundError(ERROR_MESSAGE.INVOICE_NOT_FOUND)
    }

    if (invoice.user !== userEmail) {
      logger.warn('Delete invoice failed - forbidden', {
        invoiceNumber,
        userEmail,
      })
      throw new ForbiddenError(ERROR_MESSAGE.FORBIDDEN)
    }

    if (
      invoice.status !== InvoiceStatus.DRAFT &&
      invoice.status !== InvoiceStatus.SUBMITTED
    ) {
      logger.warn('Delete invoice failed - invoice cannot be deleted', {
        invoiceNumber,
        status: invoice.status,
      })
      throw new ConflictError(ERROR_MESSAGE.CANNOT_DELETE)
    }

    // The deleted event is stored in the same write as the soft delete
    const deleted = await this.invoiceRepository.softDelete(invoiceNumber, {
      eventType: InvoiceEventType.DELETED,
      actor: userEmail,
      createdAt: new Date(),
    })

    if (!deleted) {
      logger.warn('Delete invoice failed - invoice not found', {
        invoiceNumber,
      })
      throw new NotFoundError(ERROR_MESSAGE.INVOICE_NOT_FOUND)
    }

    logger.info('Delete invoice successful', {
      invoiceNumber,
      deletedBy: userEmail,
    })

    return {
      invoiceNumber,
      deleted: true,
    }
  }

  /**
   * Retrieves change log entities for auditing trails.
   */
  async getInvoiceHistory(
    payload: GetInvoiceHistoryRequestDTO,
  ): Promise<GetInvoiceHistoryResponseDTO> {
    const { invoiceNumber, userEmail, role } = payload

    const invoice = await this.invoiceRepository.findById(invoiceNumber)

    if (!invoice) {
      logger.warn('Get invoice history failed - invoice not found', {
        invoiceNumber,
      })
      throw new NotFoundError(ERROR_MESSAGE.INVOICE_NOT_FOUND)
    }

    if (role !== UserRole.ADMIN && invoice.user !== userEmail) {
      logger.warn('Get invoice history failed - forbidden', {
        invoiceNumber,
        userEmail,
        role,
      })
      throw new ForbiddenError(ERROR_MESSAGE.FORBIDDEN)
    }

    return {
      histories: (invoice.histories ?? []).map(toInvoiceHistoryResponse),
    }
  }
}
