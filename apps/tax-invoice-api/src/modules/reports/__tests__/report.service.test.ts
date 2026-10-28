// Models
import { InvoiceModel } from '@/models'

// Types
import { UserRole, InvoiceStatus, Invoice } from '@/types'

// Services
import { reportService } from '@/container'

// Utils
import { getDateRangeUTC } from '@/utils'

// Mock data
const mockInvoices: Partial<Invoice>[] = [
  {
    invoiceNumber: 'INV-001',
    user: 'user@example.com',
    amount: 1000,
    tax: 100,
    status: InvoiceStatus.SUBMITTED,
    createdAt: new Date('2025-07-10'),
    updatedAt: new Date('2025-07-11'),
    isDeleted: false,
    histories: [],
  },
  {
    invoiceNumber: 'INV-002',
    user: 'user@example.com',
    amount: 2000,
    tax: 200,
    status: InvoiceStatus.DRAFT,
    createdAt: new Date('2025-07-12'),
    updatedAt: new Date('2025-07-12'),
    isDeleted: false,
    histories: [],
  },
]

const mockAggregateResult = [
  {
    _id: null,
    totalAmount: 3000,
    totalTax: 300,
    totalInvoices: 2,
    draftCount: 1,
    submittedCount: 1,
    approvedCount: 0,
    rejectedCount: 0,
  },
]

// Mock models
jest.mock('@/models', () => {
  const lean = jest.fn()
  const limit = jest.fn(() => ({ lean }))
  const skip = jest.fn(() => ({ limit }))
  const sort = jest.fn(() => ({ skip }))
  const select = jest.fn(() => ({ sort }))
  const find = jest.fn(() => ({ select }))
  const aggregate = jest.fn()
  const countDocuments = jest.fn()

  return {
    InvoiceModel: {
      find,
      aggregate,
      countDocuments,
      __mock: {
        find,
        select,
        sort,
        skip,
        limit,
        lean,
        aggregate,
        countDocuments,
      },
    },
  }
})

describe('ReportService', () => {
  const { find, lean, aggregate, countDocuments } = (InvoiceModel as any).__mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getInvoiceReport', () => {
    it('should return summary and invoices for admin (no status filter)', async () => {
      aggregate.mockResolvedValueOnce(mockAggregateResult)
      lean.mockResolvedValueOnce(mockInvoices)
      countDocuments.mockResolvedValueOnce(2)

      const result = await reportService.getInvoiceReport({
        from: '2025-07-01',
        to: '2025-07-31',
        userEmail: 'admin@example.com',
        userRole: UserRole.ADMIN,
      })

      const expectedRange = getDateRangeUTC('2025-07-01', '2025-07-31')

      expect(find).toHaveBeenCalledWith({
        createdAt: expectedRange,
        isDeleted: false,
        status: { $ne: InvoiceStatus.DRAFT },
      })

      expect(aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: {
              createdAt: expectedRange,
              isDeleted: false,
              status: { $ne: InvoiceStatus.DRAFT },
            },
          }),
        ]),
      )

      expect(result.summary).toEqual({
        totalInvoices: 2,
        totalAmount: 3000,
        totalTax: 300,
        draftCount: 1,
        submittedCount: 1,
        approvedCount: 0,
        rejectedCount: 0,
      })

      expect(result.invoices).toEqual(mockInvoices)

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })

    it('should return summary and invoices for user with status filter', async () => {
      aggregate.mockResolvedValueOnce([
        {
          _id: null,
          totalAmount: 1000,
          totalTax: 100,
          totalInvoices: 1,
          draftCount: 0,
          submittedCount: 1,
          approvedCount: 0,
          rejectedCount: 0,
        },
      ])
      lean.mockResolvedValueOnce([mockInvoices[0]])
      countDocuments.mockResolvedValueOnce(1)

      const result = await reportService.getInvoiceReport({
        from: '2025-07-01',
        to: '2025-07-31',
        status: InvoiceStatus.SUBMITTED,
        userEmail: 'user@example.com',
        userRole: UserRole.USER,
      })

      const expectedRange = getDateRangeUTC('2025-07-01', '2025-07-31')

      expect(find).toHaveBeenCalledWith({
        createdAt: expectedRange,
        isDeleted: false,
        status: InvoiceStatus.SUBMITTED,
        user: 'user@example.com',
      })

      expect(result.summary.totalInvoices).toBe(1)
      expect(result.summary.totalAmount).toBe(1000)
      expect(result.invoices).toEqual([mockInvoices[0]])
    })

    it('should return default summary when no invoices match', async () => {
      aggregate.mockResolvedValueOnce([])
      lean.mockResolvedValueOnce([])
      countDocuments.mockResolvedValueOnce(0)

      const result = await reportService.getInvoiceReport({
        from: '2025-07-01',
        to: '2025-07-31',
        userEmail: 'user@example.com',
        userRole: UserRole.USER,
      })

      expect(result.summary).toEqual({
        totalInvoices: 0,
        totalAmount: 0,
        totalTax: 0,
        draftCount: 0,
        submittedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
      })

      expect(result.invoices).toEqual([])
    })

    it('should use exclusive upper bound ($lt) for same-day range', async () => {
      aggregate.mockResolvedValueOnce([])
      lean.mockResolvedValueOnce([])
      countDocuments.mockResolvedValueOnce(0)

      await reportService.getInvoiceReport({
        from: '2026-06-11',
        to: '2026-06-11',
        userEmail: 'user@example.com',
        userRole: UserRole.USER,
      })

      const calledFilter = find.mock.calls[0][0]

      expect(calledFilter.createdAt.$gte).toBeDefined()
      expect(calledFilter.createdAt.$lt).toBeDefined()
      expect(calledFilter.createdAt.$lte).toBeUndefined()
    })

    it('should scope filter to user email for non-admin roles', async () => {
      aggregate.mockResolvedValueOnce([])
      lean.mockResolvedValueOnce([])
      countDocuments.mockResolvedValueOnce(0)

      await reportService.getInvoiceReport({
        from: '2025-07-01',
        to: '2025-07-31',
        userEmail: 'user@example.com',
        userRole: UserRole.USER,
      })

      const calledFilter = find.mock.calls[0][0]
      expect(calledFilter.user).toBe('user@example.com')
    })

    it('should not scope filter to user email for admin but exclude drafts', async () => {
      aggregate.mockResolvedValueOnce([])
      lean.mockResolvedValueOnce([])
      countDocuments.mockResolvedValueOnce(0)

      await reportService.getInvoiceReport({
        from: '2025-07-01',
        to: '2025-07-31',
        userEmail: 'admin@example.com',
        userRole: UserRole.ADMIN,
      })

      const calledFilter = find.mock.calls[0][0]
      expect(calledFilter.user).toBeUndefined()
      expect(calledFilter.status).toEqual({ $ne: InvoiceStatus.DRAFT })
    })
  })
})
