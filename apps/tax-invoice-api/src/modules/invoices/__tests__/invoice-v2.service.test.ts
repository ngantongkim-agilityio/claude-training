// Service
import { InvoiceV2Service } from '../invoice-v2.service'
import { InvoiceRepository } from '../invoice.repository'

// Models
import { InvoiceModel } from '@/models'

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

describe('Invoice V2 Service', () => {
  const mockDate = new Date('2026-06-22T10:00:00.000Z')
  const service = new InvoiceV2Service(new InvoiceRepository())

  const mockInvoice = {
    invoiceNumber: 'INV.001',
    user: 'testuser@example.com',
    amount: 1000,
    tax: 10,
    description: 'Test invoice',
    status: InvoiceStatus.SUBMITTED,
    isDeleted: false,
    histories: [] as any[],
    createdAt: mockDate,
    updatedAt: mockDate,
  }

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

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getInvoices', () => {
    it('should escape regex special characters in search so it matches literally', async () => {
      mockQueryBuilder.lean.mockResolvedValueOnce([mockInvoice])
      ;(InvoiceModel.countDocuments as jest.Mock).mockResolvedValueOnce(1)

      const result = await service.getInvoices({
        userEmail: mockInvoice.user,
        role: UserRole.USER,
        page: 1,
        limit: 10,
        search: 'INV.001',
      })

      expect(InvoiceModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceNumber: { $regex: 'INV\\.001', $options: 'i' },
        }),
      )
      expect(result.invoices).toHaveLength(1)
      expect(result.pagination.total).toEqual(1)
    })

    it('should sort by amount ascending with an _id tiebreaker', async () => {
      mockQueryBuilder.lean.mockResolvedValueOnce([mockInvoice])
      ;(InvoiceModel.countDocuments as jest.Mock).mockResolvedValueOnce(1)

      await service.getInvoices({
        userEmail: mockInvoice.user,
        role: UserRole.USER,
        page: 1,
        limit: 10,
        sortBy: 'amount',
        order: 'asc',
        minAmount: 500,
      })

      expect(InvoiceModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ amount: { $gte: 500 } }),
      )
      expect(mockQueryBuilder.sort).toHaveBeenCalledWith({ amount: 1, _id: 1 })
    })
  })
})
