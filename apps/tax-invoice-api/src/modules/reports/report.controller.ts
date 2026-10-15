import { Request, Response } from 'express'

// Utils
import { parseRequest, responseOk } from '@/utils'

// Constants
import { SUCCESS_MESSAGE, STATUS_CODE } from '@/constants'

// Schemas
import { GetInvoiceReportQuerySchema, ExportPdfBodySchema, EmailReportBodySchema } from './report.dto'

// Services
import type { ReportService } from './report.service'

// Queue
import { addReportEmailJob } from './queue'

export class ReportController {
  constructor(private readonly service: ReportService) {}

  /**
   * GET /reports/invoices
   *
   * Returns an invoice report with summary aggregation and filtered invoice list.
   *
   * - Admins can view all invoices.
   * - Users can view only their own invoices.
   */
  getInvoicesByFilter = async (req: Request, res: Response): Promise<void> => {
    const { from, to, status, page, limit } = parseRequest(
      GetInvoiceReportQuerySchema,
      req.query,
    )

    const report = await this.service.getInvoiceReport({
      from,
      to,
      status,
      page,
      limit,
      userEmail: req.currentUser!.email,
      userRole: req.currentUser!.role,
    })

    responseOk(res, SUCCESS_MESSAGE.FETCH_SUCCESS, report)
  }

  /**
   * POST /reports/invoices/pdf
   *
   * Generates and returns a downloadable PDF of the invoice report.
   * Same filters and authorization as the main report endpoint.
   */
  exportPdf = async (req: Request, res: Response): Promise<void> => {
    const { from, to, status } = parseRequest(
      ExportPdfBodySchema,
      req.body,
    )

    const pdfBuffer = await this.service.generateReportPdf({
      from,
      to,
      status,
      userEmail: req.currentUser!.email,
      userRole: req.currentUser!.role,
    })

    const filename = `invoice-report_${from}_${to}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.status(STATUS_CODE.OK).end(pdfBuffer)
  }

  /**
   * POST /reports/invoices/email
   *
   * Queues a report email job for async processing via BullMQ.
   * Returns 202 Accepted with the job ID immediately.
   */
  emailReport = async (req: Request, res: Response): Promise<void> => {
    const { from, to, status, recipientEmail } = parseRequest(
      EmailReportBodySchema,
      req.body,
    )

    const jobId = await addReportEmailJob({
      from,
      to,
      status,
      userEmail: req.currentUser!.email,
      userRole: req.currentUser!.role,
      recipientEmail: recipientEmail || req.currentUser!.email,
    })

    res.status(STATUS_CODE.ACCEPTED).json({
      status: 'success',
      message: SUCCESS_MESSAGE.REPORT_EMAIL_QUEUED,
      data: { jobId },
    })
  }
}
