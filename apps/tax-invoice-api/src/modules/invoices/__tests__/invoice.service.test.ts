// Service
import { invoiceService } from '@/container'

// Models
import { InvoiceModel } from '@/models'

// Utils
import { generateInvoiceNumber, trackInvoiceChanges } from '@/utils'

// Types
import { InvoiceStatus, UserRole } from '@/types'

// Mock Mongoose Model Core Layer
jest.mock('@/models', () => ({
  InvoiceModel: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  },
}))

// Mock Utilities Layer
jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils'),
  generateInvoiceNumber: jest.fn(),
  trackInvoiceChanges: jest.fn(),
}))

describe('Invoice Service', () => {
  const mockDate = new Date('2026-06-22T10:00:00.000Z')

  const mockPayload = {
    user: 'testuser@example.com',
    amount: 1000,
    tax: 10,
    description: 'Test invoice',
  }

  const mockInvoiceRaw = {
    invoiceNumber: 'INV-1234567890000-1234',
    user: mockPayload.user,
    amount: mockPayload.amount,
    tax: mockPayload.tax,
    description: mockPayload.description,
    status: InvoiceStatus.DRAFT,
    isDeleted: false,
    histories: [] as any[],
    createdAt: mockDate,
    updatedAt: mockDate,
  }

  let mockInvoice: typeof mockInvoiceRaw

  beforeEach(() => {
    // Reset and deeply clone objects to prevent state leakage across different test scopes
    mockInvoice = JSON.parse(JSON.stringify(mockInvoiceRaw))
    mockInvoice.createdAt = mockDate
    mockInvoice.updatedAt = mockDate
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ================= CREATE =================
  describe('createInvoice', () => {
    it('should invoke code hooks cleanly and persist instance inside database wrapper', async () => {
      ;(generateInvoiceNumber as jest.Mock).mockReturnValue(
        mockInvoice.invoiceNumber,
      )

      const mockCreatedDoc = {
        ...mockInvoice,
        toObject: () => mockInvoice,
      }
      ;(InvoiceModel.create as jest.Mock).mockResolvedValueOnce(mockCreatedDoc)

      const result = await invoiceService.createInvoice(mockPayload)

      expect(generateInvoiceNumber).toHaveBeenCalled()
      expect(result).toEqual({
        invoiceNumber: mockInvoice.invoiceNumber,
        status: InvoiceStatus.DRAFT,
      })
    })
  })

  // ================= GET LIST =================
  describe('getInvoices', () => {
    let mockQueryBuilder: any

    beforeEach(() => {
      mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn(),
      }
      ;(InvoiceModel.find as jest.Mock).mockReturnValue(mockQueryBuilder)
    })

    it('should fetch invoices using isolation rules tailored for USER role', async () => {
      mockQueryBuilder.lean.mockResolvedValueOnce([mockInvoice])
      ;(InvoiceModel.countDocuments as jest.Mock).mockResolvedValueOnce(1)

      const result = await invoiceService.getInvoices({
        userEmail: mockPayload.user,
        role: UserRole.USER,
        page: 1,
        limit: 10,
      })

      expect(InvoiceModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockPayload.user,
          isDeleted: { $ne: true },
        }),
      )
      expect(result.invoices[0].invoiceNumber).toEqual(
        mockInvoice.invoiceNumber,
      )
    })

    it('should ensure draft instances remain invisible to ADMIN by default', async () => {
      mockQueryBuilder.lean.mockResolvedValueOnce([])
      ;(InvoiceModel.countDocuments as jest.Mock).mockResolvedValueOnce(0)

      await invoiceService.getInvoices({
        userEmail: 'admin@example.com',
        role: UserRole.ADMIN,
        page: 1,
        limit: 10,
      })

      expect(InvoiceModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: { $ne: InvoiceStatus.DRAFT } }),
      )
    })
  })

  // ================= GET BY NUMBER =================
  describe('getInvoiceByNumber', () => {
    const invoiceNumber = mockInvoiceRaw.invoiceNumber

    it('should successfully pass data when queried by document owner tenant', async () => {
      ;(InvoiceModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(mockInvoice),
      })

      const result = await invoiceService.getInvoiceByNumber({
        invoiceNumber,
        userEmail: mockPayload.user,
        role: UserRole.USER,
      })

      expect(result.createdAt).toEqual(mockDate.toISOString())
      expect(result.invoiceNumber).toEqual(invoiceNumber)
    })

    it('should throw ForbiddenError if tenant fails ownership cross-checks', async () => {
      ;(InvoiceModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(mockInvoice),
      })

      await expect(
        invoiceService.getInvoiceByNumber({
          invoiceNumber,
          userEmail: 'attacker@example.com',
          role: UserRole.USER,
        }),
      ).rejects.toThrow()
    })
  })

  // ================= UPDATE STATUS WORKFLOW =================
  describe('updateInvoiceStatus', () => {
    const invoiceNumber = mockInvoiceRaw.invoiceNumber

    it('should allow users to advance a DRAFT status to SUBMITTED status', async () => {
      const mutableInvoiceMock = {
        ...mockInvoice,
        status: InvoiceStatus.DRAFT,
        save: jest.fn().mockResolvedValue(true),
      }
      ;(InvoiceModel.findOne as jest.Mock).mockResolvedValueOnce(
        mutableInvoiceMock,
      )

      const result = await invoiceService.updateInvoiceStatus({
        invoiceNumber,
        status: InvoiceStatus.SUBMITTED,
        userEmail: mockPayload.user,
        role: UserRole.USER,
      })

      expect(mutableInvoiceMock.status).toEqual(InvoiceStatus.SUBMITTED)
      expect(mutableInvoiceMock.save).toHaveBeenCalled()
      expect(result).toEqual({ invoiceNumber, status: InvoiceStatus.SUBMITTED })
    })

    it('should allow ADMIN to approve a SUBMITTED invoice', async () => {
      const mutableInvoiceMock = {
        ...mockInvoice,
        status: InvoiceStatus.SUBMITTED,
        save: jest.fn().mockResolvedValue(true),
      }
      ;(InvoiceModel.findOne as jest.Mock).mockResolvedValueOnce(
        mutableInvoiceMock,
      )

      const result = await invoiceService.updateInvoiceStatus({
        invoiceNumber,
        status: InvoiceStatus.APPROVED,
        userEmail: 'admin@example.com',
        role: UserRole.ADMIN,
      })

      expect(mutableInvoiceMock.status).toEqual(InvoiceStatus.APPROVED)
      expect(result.status).toEqual(InvoiceStatus.APPROVED)
    })

    it('should throw ConflictError if trying to modify final state statuses like APPROVED', async () => {
      const finalInvoiceMock = {
        ...mockInvoice,
        status: InvoiceStatus.APPROVED,
      }
      ;(InvoiceModel.findOne as jest.Mock).mockResolvedValueOnce(
        finalInvoiceMock,
      )

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.SUBMITTED,
          userEmail: 'admin@example.com',
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow()
    })
  })

  // ================= UPDATE INFO & HISTORIES =================
  describe('updateInvoiceInfo', () => {
    const invoiceNumber = mockInvoiceRaw.invoiceNumber

    it('should log audit changes on histories array when modification hits SUBMITTED states', async () => {
      const submittedInvoiceMock = {
        ...mockInvoice,
        status: InvoiceStatus.SUBMITTED,
        histories: [] as any[],
        save: jest.fn().mockResolvedValue(true),
      }
      ;(InvoiceModel.findOne as jest.Mock).mockResolvedValueOnce(
        submittedInvoiceMock,
      )

      const mockTrackedChanges = {
        updatedInvoice: { amount: 2000 },
        changes: { amount: { old: 1000, new: 2000 } },
      }
      ;(trackInvoiceChanges as jest.Mock).mockReturnValueOnce(
        mockTrackedChanges,
      )

      const result = await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: 2000,
      })

      expect(submittedInvoiceMock.histories.length).toBe(1)
      expect(submittedInvoiceMock.histories[0].changes).toEqual(
        mockTrackedChanges.changes,
      )
      expect(submittedInvoiceMock.save).toHaveBeenCalled()
      expect(result.updatedFields).toContain('amount')
    })
  })

  // ================= DELETE =================
  describe('deleteInvoice', () => {
    const invoiceNumber = mockInvoiceRaw.invoiceNumber

    it('should let owners execute soft-delete if current state remains flexible', async () => {
      ;(InvoiceModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(mockInvoice), // Repository.findById call
      })
      ;(InvoiceModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValueOnce({ ...mockInvoice, isDeleted: true }), // Repository.softDelete call
      })

      const result = await invoiceService.deleteInvoice({
        invoiceNumber,
        userEmail: mockPayload.user,
      })

      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { invoiceNumber },
        { isDeleted: true },
        { new: true },
      )
      expect(result).toEqual({ invoiceNumber, deleted: true })
    })

    it('should throw ConflictError if trying to wipe out validated final state collections', async () => {
      const rigidInvoiceMock = {
        ...mockInvoice,
        status: InvoiceStatus.APPROVED,
      }
      ;(InvoiceModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(rigidInvoiceMock),
      })

      await expect(
        invoiceService.deleteInvoice({
          invoiceNumber,
          userEmail: mockPayload.user,
        }),
      ).rejects.toThrow()
    })
  })

  // ================= AUDIT LOG HISTORY =================
  describe('getInvoiceHistory', () => {
    const invoiceNumber = mockInvoiceRaw.invoiceNumber

    it('should compile array mappings cleanly to return timestamp ISO layout collections', async () => {
      const historicalInvoiceMock = {
        ...mockInvoice,
        histories: [
          { changes: { amount: { old: 500, new: 1000 } }, createdAt: mockDate },
        ],
      }
      ;(InvoiceModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(historicalInvoiceMock),
      })

      const result = await invoiceService.getInvoiceHistory({
        invoiceNumber,
        userEmail: mockPayload.user,
        role: UserRole.USER,
      })

      expect(result.histories[0].createdAt).toEqual(mockDate.toISOString())
      expect(result.histories[0].changes).toHaveProperty('amount')
    })
  })
})
