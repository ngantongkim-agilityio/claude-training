import { Request, Response, NextFunction } from 'express'

// Controller
import { InvoiceController } from '../invoice.controller'

// Constants
import { SUCCESS_MESSAGE } from '@/constants'

// Types
import { UserRole } from '@/types'

// Utils
import { isInvoiceStatus, parseRequest } from '@/utils'

// Mock utils and helper behaviors safely
jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils'),
  parseRequest: jest.fn((_, data) => data),
  isInvoiceStatus: jest.fn((status: string) => status === 'submitted'),
}))

describe('InvoiceController', () => {
  let invoiceController: InvoiceController
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let invoiceService: any
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  const mockUser = {
    email: 'testuser@example.com',
    role: UserRole.USER,
  }

  beforeEach(() => {
    // Setup clean mock implementations for Express Response mapping pipelines
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    // Mock NextFunction to fulfill structural RequestHandler signature constraints
    next = jest.fn()

    invoiceService = {
      createInvoice: jest.fn(),
      getInvoices: jest.fn(),
      getInvoiceByNumber: jest.fn(),
      updateInvoiceStatus: jest.fn(),
      updateInvoiceInfo: jest.fn(),
      deleteInvoice: jest.fn(),
      getInvoiceHistory: jest.fn(),
    }

    invoiceController = new InvoiceController(invoiceService)

    req = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentUser: mockUser as any,
      body: {
        amount: 1000,
        tax: 50,
        description: 'Test invoice',
      },
      query: {},
      params: {
        invoiceNumber: 'INV-001',
      },
    }

    jest.clearAllMocks()
  })

  // ---------------- CREATE ----------------
  describe('createInvoice', () => {
    it('should create invoice and route success via BaseController.created wrapper', async () => {
      const mockInvoice = { invoiceNumber: 'INV-001' }
      invoiceService.createInvoice.mockResolvedValueOnce(mockInvoice)

      await invoiceController.createInvoice(
        req as Request,
        res as Response,
        next,
      )

      expect(invoiceService.createInvoice).toHaveBeenCalledWith({
        user: mockUser.email,
        amount: 1000,
        tax: 50,
        description: 'Test invoice',
      })

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.CREATE_SUCCESS,
        data: mockInvoice,
      })
    })

    it('should catch identity anomalies and reject access if role is ADMIN', async () => {
      req.currentUser = {
        email: 'admin@gmail.com',
        role: UserRole.ADMIN,
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any

      await invoiceController.createInvoice(
        req as Request,
        res as Response,
        next,
      )

      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  // ---------------- GET INVOICES ----------------
  describe('getInvoices', () => {
    it('should pass query constraints to service layer and serialize paginated results', async () => {
      const mockResult = {
        invoices: [{ invoiceNumber: 'INV-001' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }
      req.query = { page: '1', limit: '10' }
      invoiceService.getInvoices.mockResolvedValueOnce(mockResult)

      await invoiceController.getInvoices(req as Request, res as Response, next)

      expect(invoiceService.getInvoices).toHaveBeenCalledWith({
        userEmail: mockUser.email,
        role: mockUser.role,
        page: '1',
        limit: '10',
      })

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.FETCH_SUCCESS,
        data: mockResult,
      })
    })
  })

  // ---------------- GET BY NUMBER ----------------
  describe('getInvoiceByNumber', () => {
    it('should locate details matching criteria params successfully', async () => {
      const mockInvoiceDetails = { invoiceNumber: 'INV-001', amount: 1000 }
      req.params = { invoiceNumber: 'INV-001' }
      invoiceService.getInvoiceByNumber.mockResolvedValueOnce(
        mockInvoiceDetails,
      )

      await invoiceController.getInvoiceByNumber(
        req as Request,
        res as Response,
        next,
      )

      expect(invoiceService.getInvoiceByNumber).toHaveBeenCalledWith({
        invoiceNumber: 'INV-001',
        userEmail: mockUser.email,
        role: mockUser.role,
      })

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.FETCH_SUCCESS,
        data: {
          invoice: mockInvoiceDetails,
        },
      })
    })
  })

  // ---------------- UPDATE STATUS ----------------
  describe('updateInvoiceStatus', () => {
    it('should modify state tracking metrics over target statuses pipelines', async () => {
      const mockStatusResponse = {
        invoiceNumber: 'INV-001',
        status: 'submitted',
      }
      req.params = { invoiceNumber: 'INV-001' }
      req.body = { status: 'submitted' }
      invoiceService.updateInvoiceStatus.mockResolvedValueOnce(
        mockStatusResponse,
      )

      await invoiceController.updateInvoiceStatus(
        req as Request,
        res as Response,
        next,
      )

      expect(invoiceService.updateInvoiceStatus).toHaveBeenCalledWith({
        invoiceNumber: 'INV-001',
        status: 'submitted',
        reason: undefined,
        comment: undefined,
        userEmail: mockUser.email,
        role: mockUser.role,
      })

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.UPDATE_SUCCESS,
        data: mockStatusResponse,
      })
    })

    it('should block execution layers and throw ValidationError if status payload is garbage', async () => {
      req.body = { status: 'invalid' }

      await invoiceController.updateInvoiceStatus(
        req as Request,
        res as Response,
        next,
      )

      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should pass the reason and comment to the service', async () => {
      jest.mocked(isInvoiceStatus).mockReturnValueOnce(true)
      req.body = { status: 'rejected', reason: 'Tax should be 10%' }
      invoiceService.updateInvoiceStatus.mockResolvedValueOnce({
        invoiceNumber: 'INV-001',
        status: 'rejected',
      })

      await invoiceController.updateInvoiceStatus(
        req as Request,
        res as Response,
        next,
      )

      expect(invoiceService.updateInvoiceStatus).toHaveBeenCalledWith({
        invoiceNumber: 'INV-001',
        status: 'rejected',
        reason: 'Tax should be 10%',
        comment: undefined,
        userEmail: mockUser.email,
        role: mockUser.role,
      })
    })

    it('should pass the trimmed reason from the real schema to the service (TC-16)', async () => {
      jest
        .mocked(parseRequest)
        .mockImplementationOnce(jest.requireActual('@/utils').parseRequest)
      jest.mocked(isInvoiceStatus).mockReturnValueOnce(true)
      req.body = { status: 'rejected', reason: '  Tax should be 10%  ' }
      invoiceService.updateInvoiceStatus.mockResolvedValueOnce({
        invoiceNumber: 'INV-001',
        status: 'rejected',
      })

      await invoiceController.updateInvoiceStatus(
        req as Request,
        res as Response,
        next,
      )

      expect(invoiceService.updateInvoiceStatus).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'Tax should be 10%' }),
      )
    })

    // Body validation runs before any permission, status or existence check (T2-DQ1)
    it('should return 400 for a bad body from a non-admin without calling the service (TC-60)', async () => {
      jest
        .mocked(parseRequest)
        .mockImplementationOnce(jest.requireActual('@/utils').parseRequest)
      req.body = { status: 'approved', reason: 'Tax is wrong' }

      await invoiceController.updateInvoiceStatus(
        req as Request,
        res as Response,
        next,
      )

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          errors: {
            reason: 'Reason is only allowed when status is rejected',
          },
        }),
      )
      expect(invoiceService.updateInvoiceStatus).not.toHaveBeenCalled()
    })
  })

  // ---------------- UPDATE INFO ----------------
  describe('updateInvoiceInfo', () => {
    it('should mutate editable fields and record structural audit configurations', async () => {
      const mockUpdateResponse = {
        invoiceNumber: 'INV-001',
        updatedFields: ['amount'],
      }
      req.params = { invoiceNumber: 'INV-001' }
      invoiceService.updateInvoiceInfo.mockResolvedValueOnce(mockUpdateResponse)

      await invoiceController.updateInvoiceInfo(
        req as Request,
        res as Response,
        next,
      )

      expect(invoiceService.updateInvoiceInfo).toHaveBeenCalledWith({
        invoiceNumber: 'INV-001',
        userEmail: mockUser.email,
        amount: 1000,
        tax: 50,
        description: 'Test invoice',
      })

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.UPDATE_SUCCESS,
        data: mockUpdateResponse,
      })
    })
  })

  // ---------------- DELETE ----------------
  describe('deleteInvoice', () => {
    it('should trigger isolated record mutation flow to execute soft delete flag', async () => {
      const mockDeleteResponse = { invoiceNumber: 'INV-001', deleted: true }
      req.params = { invoiceNumber: 'INV-001' }
      invoiceService.deleteInvoice.mockResolvedValueOnce(mockDeleteResponse)

      await invoiceController.deleteInvoice(
        req as Request,
        res as Response,
        next,
      )

      expect(invoiceService.deleteInvoice).toHaveBeenCalledWith({
        invoiceNumber: 'INV-001',
        userEmail: mockUser.email,
      })

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.DELETE_SUCCESS,
        data: mockDeleteResponse,
      })
    })
  })

  // ---------------- HISTORY ----------------
  describe('getInvoiceHistory', () => {
    it('should collect mapped internal histories logging mutations trails', async () => {
      const mockHistoryResponse = { histories: [] }
      req.params = { invoiceNumber: 'INV-001' }
      invoiceService.getInvoiceHistory.mockResolvedValueOnce(
        mockHistoryResponse,
      )

      await invoiceController.getInvoiceHistory(
        req as Request,
        res as Response,
        next,
      )

      expect(invoiceService.getInvoiceHistory).toHaveBeenCalledWith({
        invoiceNumber: 'INV-001',
        userEmail: mockUser.email,
        role: mockUser.role,
      })

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.FETCH_SUCCESS,
        data: mockHistoryResponse,
      })
    })
  })
})
