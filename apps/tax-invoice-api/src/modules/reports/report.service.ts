import { FilterQuery } from 'mongoose'

// Models
import { InvoiceModel } from '@/models'

// Configs
import { createModuleLogger } from '@/configs'

// Types
import { Invoice, InvoiceStatus, UserRole } from '@/types'

// DTOs
import type { InvoiceReportSummary } from './report.dto'

// Services
import type { PdfService } from './services/pdf.service'

// Utils
import { getDateRangeUTC } from '@/utils'

const logger = createModuleLogger('ReportService')

const DEFAULT_SUMMARY: InvoiceReportSummary = {
  totalInvoices: 0,
  totalAmount: 0,
  totalTax: 0,
  draftCount: 0,
  submittedCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
}

export class ReportService {
  constructor(private readonly pdfService: PdfService) {}

  /**
   * Build the Mongoose filter shared by both summary aggregation and invoice list.
   * Admins see all non-draft invoices (only submitted/approved/rejected);
   * regular users are scoped to their own email and can see all statuses.
   * Date range uses UTC boundaries with exclusive upper bound ($lt).
   */
  private buildFilter = ({
    from,
    to,
    status,
    userEmail,
    userRole,
  }: {
    from: string
    to: string
    status?: string
    userEmail: string
    userRole: UserRole
  }): FilterQuery<Invoice> => {
    const filter: FilterQuery<Invoice> = {
      createdAt: getDateRangeUTC(from, to),
      isDeleted: false,
    }

    if (status) {
      filter.status = status
    }

    if (userRole === UserRole.ADMIN) {
      // Admins only see invoices that have been submitted for review or processed
      if (!status) {
        filter.status = { $ne: InvoiceStatus.DRAFT }
      }
    } else {
      // Non-admin users can only see their own invoices
      filter.user = userEmail
    }

    return filter
  }

  /**
   * Generate an invoice report with summary aggregation and filtered invoice list (paginated).
   *
   * Used by the listing endpoint. Runs aggregation, paginated find, and count in parallel.
   */
  getInvoiceReport = async ({
    from,
    to,
    status,
    userEmail,
    userRole,
    page = 1,
    limit = 10,
  }: {
    from: string
    to: string
    status?: string
    userEmail: string
    userRole: UserRole
    page?: number
    limit?: number
  }) => {
    const filter = this.buildFilter({ from, to, status, userEmail, userRole })
    const skip = (page - 1) * limit

    const [summaryResult, invoices, total] = await Promise.all([
      InvoiceModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalTax: { $sum: { $ifNull: ['$tax', 0] } },
            totalInvoices: { $sum: 1 },
            draftCount: {
              $sum: {
                $cond: [{ $eq: ['$status', InvoiceStatus.DRAFT] }, 1, 0],
              },
            },
            submittedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', InvoiceStatus.SUBMITTED] }, 1, 0],
              },
            },
            approvedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', InvoiceStatus.APPROVED] }, 1, 0],
              },
            },
            rejectedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', InvoiceStatus.REJECTED] }, 1, 0],
              },
            },
          },
        },
      ]),
      InvoiceModel.find(filter)
        .select('-__v -_id -isDeleted')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InvoiceModel.countDocuments(filter),
    ])

    const summary: InvoiceReportSummary =
      summaryResult.length > 0
        ? {
            totalInvoices: summaryResult[0].totalInvoices,
            totalAmount: summaryResult[0].totalAmount,
            totalTax: summaryResult[0].totalTax,
            draftCount: summaryResult[0].draftCount,
            submittedCount: summaryResult[0].submittedCount,
            approvedCount: summaryResult[0].approvedCount,
            rejectedCount: summaryResult[0].rejectedCount,
          }
        : DEFAULT_SUMMARY

    logger.info('Get invoice report successful', {
      userEmail,
      userRole,
      from,
      to,
      status,
      page,
      limit,
      total,
      totalInvoices: summary.totalInvoices,
    })

    return {
      summary,
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Generate an invoice report with all matching invoices (no pagination).
   *
   * Used by PDF export and email report generation where the full dataset is needed.
   */
  getFullInvoiceReport = async ({
    from,
    to,
    status,
    userEmail,
    userRole,
  }: {
    from: string
    to: string
    status?: string
    userEmail: string
    userRole: UserRole
  }) => {
    const filter = this.buildFilter({ from, to, status, userEmail, userRole })

    const [summaryResult, invoices] = await Promise.all([
      InvoiceModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalTax: { $sum: { $ifNull: ['$tax', 0] } },
            totalInvoices: { $sum: 1 },
            draftCount: {
              $sum: {
                $cond: [{ $eq: ['$status', InvoiceStatus.DRAFT] }, 1, 0],
              },
            },
            submittedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', InvoiceStatus.SUBMITTED] }, 1, 0],
              },
            },
            approvedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', InvoiceStatus.APPROVED] }, 1, 0],
              },
            },
            rejectedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', InvoiceStatus.REJECTED] }, 1, 0],
              },
            },
          },
        },
      ]),
      InvoiceModel.find(filter)
        .select('-__v -_id -isDeleted')
        .sort({ createdAt: -1 })
        .lean(),
    ])

    const summary: InvoiceReportSummary =
      summaryResult.length > 0
        ? {
            totalInvoices: summaryResult[0].totalInvoices,
            totalAmount: summaryResult[0].totalAmount,
            totalTax: summaryResult[0].totalTax,
            draftCount: summaryResult[0].draftCount,
            submittedCount: summaryResult[0].submittedCount,
            approvedCount: summaryResult[0].approvedCount,
            rejectedCount: summaryResult[0].rejectedCount,
          }
        : DEFAULT_SUMMARY

    logger.info('Get full invoice report successful', {
      userEmail,
      userRole,
      from,
      to,
      status,
      totalInvoices: summary.totalInvoices,
    })

    return { summary, invoices }
  }

  /**
   * Generate the invoice report as a PDF buffer.
   * Fetches report data then delegates PDF rendering to PdfService.
   * Reused by both the synchronous export endpoint and the async email worker.
   */
  generateReportPdf = async ({
    from,
    to,
    status,
    userEmail,
    userRole,
  }: {
    from: string
    to: string
    status?: string
    userEmail: string
    userRole: UserRole
  }): Promise<Buffer> => {
    const { summary, invoices } = await this.getFullInvoiceReport({
      from,
      to,
      status,
      userEmail,
      userRole,
    })

    const pdfBuffer = await this.pdfService.generateInvoiceReportPdf({
      from,
      to,
      status,
      summary,
      invoices: invoices as any,
    })

    return pdfBuffer
  }
}
