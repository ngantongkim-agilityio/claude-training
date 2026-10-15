import { Request, Response } from 'express'

// Controllers
import { ReportController } from '../report.controller'

// Services
import { ReportService } from '../report.service'

// Constants
import { STATUS_CODE, SUCCESS_MESSAGE } from '@/constants'

// Types
import { UserRole } from '@/types'

// Utils
import { ValidationError } from '@/utils'

// Mock the queue module
jest.mock('../queue', () => ({
  addReportEmailJob: jest.fn().mockResolvedValue('job-123'),
}))

import { addReportEmailJob } from '../queue'

type MockReq = Partial<Request>
type MockRes = Partial<Response> & {
  status: jest.Mock
  json: jest.Mock
  setHeader: jest.Mock
  end: jest.Mock
}

describe('Report Controller', () => {
  let req: MockReq
  let res: MockRes
  let reportController: ReportController
  let mockReportService: jest.Mocked<ReportService>

  const mockUser = {
    email: 'testuser@example.com',
    role: UserRole.USER,
  }

  const mockAdmin = {
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    iat: 1234567890,
    exp: 9999999999,
  }

  const mockReportResult = {
    summary: {
      totalInvoices: 1,
      totalAmount: 1000,
      totalTax: 100,
      draftCount: 0,
      submittedCount: 1,
      approvedCount: 0,
      rejectedCount: 0,
    },
    invoices: [{ invoiceNumber: 'INV-001' }],
  }

  beforeEach(() => {
    mockReportService = {
      getInvoiceReport: jest.fn(),
      generateReportPdf: jest.fn(),
    } as unknown as jest.Mocked<ReportService>

    reportController = new ReportController(mockReportService)

    req = {
      currentUser: mockUser as any,
      query: {
        from: '2024-01-01',
        to: '2024-01-31',
      },
      body: {},
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    }

    jest.clearAllMocks()
  })

  // ================= SUCCESS CASES =================
  describe('getInvoicesByFilter', () => {
    it('should return report with summary and invoices (no status)', async () => {
      ;(mockReportService.getInvoiceReport as jest.Mock).mockResolvedValueOnce(
        mockReportResult,
      )

      await reportController.getInvoicesByFilter(
        req as Request,
        res as Response,
      )

      expect(mockReportService.getInvoiceReport).toHaveBeenCalledWith({
        from: '2024-01-01',
        to: '2024-01-31',
        status: undefined,
        userEmail: mockUser.email,
        userRole: mockUser.role,
      })

      expect(res.status).toHaveBeenCalledWith(STATUS_CODE.OK)
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.FETCH_SUCCESS,
        data: mockReportResult,
      })
    })

    it('should return report with status filter', async () => {
      req.query = {
        from: '2024-01-01',
        to: '2024-01-31',
        status: 'submitted',
      }

      ;(mockReportService.getInvoiceReport as jest.Mock).mockResolvedValueOnce(
        mockReportResult,
      )

      await reportController.getInvoicesByFilter(
        req as Request,
        res as Response,
      )

      expect(mockReportService.getInvoiceReport).toHaveBeenCalledWith({
        from: '2024-01-01',
        to: '2024-01-31',
        status: 'submitted',
        userEmail: mockUser.email,
        userRole: mockUser.role,
      })
    })

    it('should pass admin role to service', async () => {
      req.currentUser = mockAdmin
      req.query = {
        from: '2024-01-01',
        to: '2024-01-31',
      }

      ;(mockReportService.getInvoiceReport as jest.Mock).mockResolvedValueOnce(
        mockReportResult,
      )

      await reportController.getInvoicesByFilter(
        req as Request,
        res as Response,
      )

      expect(mockReportService.getInvoiceReport).toHaveBeenCalledWith({
        from: '2024-01-01',
        to: '2024-01-31',
        status: undefined,
        userEmail: mockAdmin.email,
        userRole: mockAdmin.role,
      })
    })

    it('should return empty report when no invoices match', async () => {
      const emptyReport = {
        summary: {
          totalInvoices: 0,
          totalAmount: 0,
          totalTax: 0,
          draftCount: 0,
          submittedCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
        },
        invoices: [],
      }

      ;(mockReportService.getInvoiceReport as jest.Mock).mockResolvedValueOnce(
        emptyReport,
      )

      await reportController.getInvoicesByFilter(
        req as Request,
        res as Response,
      )

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.FETCH_SUCCESS,
        data: emptyReport,
      })
    })
  })

  // ================= VALIDATION CASES =================
  describe('Validation errors', () => {
    it('should throw error when missing from', async () => {
      req.query = {
        to: '2024-01-31',
      }

      await expect(
        reportController.getInvoicesByFilter(req as Request, res as Response),
      ).rejects.toThrow(ValidationError)

      expect(mockReportService.getInvoiceReport).not.toHaveBeenCalled()
    })

    it('should throw error when missing to', async () => {
      req.query = {
        from: '2024-01-01',
      }

      await expect(
        reportController.getInvoicesByFilter(req as Request, res as Response),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw error when empty query', async () => {
      req.query = {}

      await expect(
        reportController.getInvoicesByFilter(req as Request, res as Response),
      ).rejects.toThrow(ValidationError)

      expect(mockReportService.getInvoiceReport).not.toHaveBeenCalled()
    })
  })

  // ================= EXPORT PDF =================
  describe('exportPdf', () => {
    it('should return PDF buffer with correct headers', async () => {
      const mockPdfBuffer = Buffer.from('fake-pdf-content')
      req.body = { from: '2024-01-01', to: '2024-01-31' }

      ;(mockReportService.generateReportPdf as jest.Mock).mockResolvedValueOnce(
        mockPdfBuffer,
      )

      await reportController.exportPdf(req as Request, res as unknown as Response)

      expect(mockReportService.generateReportPdf).toHaveBeenCalledWith({
        from: '2024-01-01',
        to: '2024-01-31',
        status: undefined,
        userEmail: mockUser.email,
        userRole: mockUser.role,
      })

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf')
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="invoice-report_2024-01-01_2024-01-31.pdf"',
      )
      expect(res.setHeader).toHaveBeenCalledWith('Content-Length', mockPdfBuffer.length)
      expect(res.status).toHaveBeenCalledWith(STATUS_CODE.OK)
      expect(res.end).toHaveBeenCalledWith(mockPdfBuffer)
    })

    it('should throw validation error when missing from', async () => {
      req.body = { to: '2024-01-31' }

      await expect(
        reportController.exportPdf(req as Request, res as unknown as Response),
      ).rejects.toThrow(ValidationError)

      expect(mockReportService.generateReportPdf).not.toHaveBeenCalled()
    })
  })

  // ================= EMAIL REPORT =================
  describe('emailReport', () => {
    it('should queue email job and return 202', async () => {
      req.body = {
        from: '2024-01-01',
        to: '2024-01-31',
      }

      await reportController.emailReport(req as Request, res as unknown as Response)

      expect(addReportEmailJob).toHaveBeenCalledWith({
        from: '2024-01-01',
        to: '2024-01-31',
        status: undefined,
        userEmail: mockUser.email,
        userRole: mockUser.role,
        recipientEmail: mockUser.email,
      })

      expect(res.status).toHaveBeenCalledWith(STATUS_CODE.ACCEPTED)
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.REPORT_EMAIL_QUEUED,
        data: { jobId: 'job-123' },
      })
    })

    it('should use custom recipientEmail when provided', async () => {
      req.body = {
        from: '2024-01-01',
        to: '2024-01-31',
        recipientEmail: 'custom@example.com',
      }

      await reportController.emailReport(req as Request, res as unknown as Response)

      expect(addReportEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'custom@example.com',
        }),
      )
    })

    it('should throw validation error when missing from', async () => {
      req.body = { to: '2024-01-31' }

      await expect(
        reportController.emailReport(req as Request, res as unknown as Response),
      ).rejects.toThrow(ValidationError)

      expect(addReportEmailJob).not.toHaveBeenCalled()
    })

    it('should throw validation error for invalid recipientEmail', async () => {
      req.body = {
        from: '2024-01-01',
        to: '2024-01-31',
        recipientEmail: 'not-an-email',
      }

      await expect(
        reportController.emailReport(req as Request, res as unknown as Response),
      ).rejects.toThrow(ValidationError)
    })
  })
})
