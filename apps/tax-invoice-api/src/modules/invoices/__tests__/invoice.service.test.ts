// Service
import { invoiceService } from '@/container'

// Constants
import { ERROR_MESSAGE } from '@/constants'

// Models
import { InvoiceModel, UserModel } from '@/models'

// Utils
import {
  ConflictError,
  ForbiddenError,
  generateInvoiceNumber,
  NotFoundError,
  trackInvoiceChanges,
} from '@/utils'

// Types
import {
  InvoiceEventType,
  InvoiceHistory,
  InvoiceStatus,
  UserRole,
} from '@/types'

// Mock Mongoose Model Core Layer
jest.mock('@/models', () => ({
  InvoiceModel: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  },
  // History reads must never look actors up (actor is an email snapshot)
  UserModel: {
    find: jest.fn(),
    findOne: jest.fn(),
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

    // Admins can't create invoices (the controller returns 403), so the creator is a user
    it('should record exactly one created event with the creator as actor', async () => {
      ;(InvoiceModel.create as jest.Mock).mockResolvedValueOnce({
        toObject: () => mockInvoice,
      })

      await invoiceService.createInvoice(mockPayload)

      const { histories } = (InvoiceModel.create as jest.Mock).mock.calls[0][0]
      expect(histories).toEqual([
        {
          eventType: InvoiceEventType.CREATED,
          actor: mockPayload.user,
          createdAt: expect.any(Date),
        },
      ])
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

    it('should escape regex special characters in search so it matches literally', async () => {
      mockQueryBuilder.lean.mockResolvedValueOnce([mockInvoice])
      ;(InvoiceModel.countDocuments as jest.Mock).mockResolvedValueOnce(1)

      await invoiceService.getInvoices({
        userEmail: mockPayload.user,
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
    })

    it('should sort by amount with an _id tiebreaker for stable pagination', async () => {
      mockQueryBuilder.lean.mockResolvedValueOnce([mockInvoice])
      ;(InvoiceModel.countDocuments as jest.Mock).mockResolvedValueOnce(1)

      await invoiceService.getInvoices({
        userEmail: mockPayload.user,
        role: UserRole.USER,
        page: 1,
        limit: 10,
        sortBy: 'amount',
      })

      const sortArg = mockQueryBuilder.sort.mock.calls[0][0]
      expect(sortArg).toEqual({ amount: -1, _id: -1 })
      // Mongo applies sort keys in insertion order: amount first, _id only breaks ties
      expect(Object.keys(sortArg)).toEqual(['amount', '_id'])
    })

    it('should default to createdAt desc without a tiebreaker so the createdAt index applies', async () => {
      mockQueryBuilder.lean.mockResolvedValueOnce([])
      ;(InvoiceModel.countDocuments as jest.Mock).mockResolvedValueOnce(0)

      await invoiceService.getInvoices({
        userEmail: mockPayload.user,
        role: UserRole.USER,
        page: 1,
        limit: 10,
      })

      expect(mockQueryBuilder.sort).toHaveBeenCalledWith({ createdAt: -1 })
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
    const adminEmail = 'admin@example.com'

    const givenStoredInvoice = (overrides: Record<string, unknown>) => {
      ;(InvoiceModel.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockInvoice,
        ...overrides,
      })
    }

    // The guarded update returns the updated invoice, or null when nothing matched
    const givenGuardedUpdate = (result: Record<string, unknown> | null) => {
      ;(InvoiceModel.findOneAndUpdate as jest.Mock).mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(result),
      })
    }

    const expectGuardedUpdate = (
      fromStatus: InvoiceStatus,
      toStatus: InvoiceStatus,
      event: Record<string, unknown>,
    ) => {
      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledTimes(1)
      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { invoiceNumber, isDeleted: { $ne: true }, status: fromStatus },
        {
          $set: { status: toStatus },
          $push: { histories: { ...event, createdAt: expect.any(Date) } },
        },
        { new: true },
      )
    }

    it('should record a submitted event with the owner when a draft is submitted', async () => {
      givenStoredInvoice({ status: InvoiceStatus.DRAFT })
      givenGuardedUpdate({ ...mockInvoice, status: InvoiceStatus.SUBMITTED })

      const result = await invoiceService.updateInvoiceStatus({
        invoiceNumber,
        status: InvoiceStatus.SUBMITTED,
        userEmail: mockPayload.user,
        role: UserRole.USER,
      })

      expectGuardedUpdate(InvoiceStatus.DRAFT, InvoiceStatus.SUBMITTED, {
        eventType: InvoiceEventType.SUBMITTED,
        actor: mockPayload.user,
      })
      expect(result).toEqual({ invoiceNumber, status: InvoiceStatus.SUBMITTED })
    })

    it('should record a rejected event with the admin and the reason', async () => {
      givenStoredInvoice({ status: InvoiceStatus.SUBMITTED })
      givenGuardedUpdate({ ...mockInvoice, status: InvoiceStatus.REJECTED })

      const result = await invoiceService.updateInvoiceStatus({
        invoiceNumber,
        status: InvoiceStatus.REJECTED,
        reason: 'Tax should be 10%',
        userEmail: adminEmail,
        role: UserRole.ADMIN,
      })

      expectGuardedUpdate(InvoiceStatus.SUBMITTED, InvoiceStatus.REJECTED, {
        eventType: InvoiceEventType.REJECTED,
        actor: adminEmail,
        reason: 'Tax should be 10%',
      })
      expect(result).toEqual({ invoiceNumber, status: InvoiceStatus.REJECTED })
    })

    it('should record an approved event with the comment when one is given', async () => {
      givenStoredInvoice({ status: InvoiceStatus.SUBMITTED })
      givenGuardedUpdate({ ...mockInvoice, status: InvoiceStatus.APPROVED })

      const result = await invoiceService.updateInvoiceStatus({
        invoiceNumber,
        status: InvoiceStatus.APPROVED,
        comment: 'Matches PO-2291',
        userEmail: adminEmail,
        role: UserRole.ADMIN,
      })

      expectGuardedUpdate(InvoiceStatus.SUBMITTED, InvoiceStatus.APPROVED, {
        eventType: InvoiceEventType.APPROVED,
        actor: adminEmail,
        comment: 'Matches PO-2291',
      })
      expect(result).toEqual({ invoiceNumber, status: InvoiceStatus.APPROVED })
    })

    it.each([
      ['no comment', undefined],
      ['an empty comment', ''],
    ])(
      'should record an approved event without a comment key for %s',
      async (_label, comment) => {
        givenStoredInvoice({ status: InvoiceStatus.SUBMITTED })
        givenGuardedUpdate({ ...mockInvoice, status: InvoiceStatus.APPROVED })

        await invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.APPROVED,
          comment,
          userEmail: adminEmail,
          role: UserRole.ADMIN,
        })

        const update = (InvoiceModel.findOneAndUpdate as jest.Mock).mock
          .calls[0][1]
        expect(update.$push.histories).not.toHaveProperty('comment')
        expect(update.$push.histories).not.toHaveProperty('reason')
      },
    )

    it('should throw NotFoundError and write nothing for an unknown invoice', async () => {
      ;(InvoiceModel.findOne as jest.Mock).mockResolvedValueOnce(null)

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.APPROVED,
          userEmail: adminEmail,
          role: UserRole.ADMIN,
        }),
      ).rejects.toBeInstanceOf(NotFoundError)
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenError and write nothing for another user', async () => {
      givenStoredInvoice({ status: InvoiceStatus.DRAFT })

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.SUBMITTED,
          userEmail: 'attacker@example.com',
          role: UserRole.USER,
        }),
      ).rejects.toMatchObject({ message: ERROR_MESSAGE.FORBIDDEN })
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it.each([InvoiceStatus.APPROVED, InvoiceStatus.REJECTED])(
      'should throw ConflictError and write nothing when the invoice is %s',
      async (currentStatus) => {
        givenStoredInvoice({ status: currentStatus })

        await expect(
          invoiceService.updateInvoiceStatus({
            invoiceNumber,
            status: InvoiceStatus.SUBMITTED,
            userEmail: adminEmail,
            role: UserRole.ADMIN,
          }),
        ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.CANNOT_UPDATE))
        expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
      },
    )

    it('should keep 403 INVALID_STATUS and write nothing when an owner tries to approve', async () => {
      givenStoredInvoice({ status: InvoiceStatus.SUBMITTED })

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.APPROVED,
          userEmail: mockPayload.user,
          role: UserRole.USER,
        }),
      ).rejects.toEqual(new ForbiddenError(ERROR_MESSAGE.INVALID_STATUS))
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should throw ConflictError when another request changed the status first', async () => {
      givenStoredInvoice({ status: InvoiceStatus.SUBMITTED })
      givenGuardedUpdate(null)

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.REJECTED,
          reason: 'Tax should be 10%',
          userEmail: adminEmail,
          role: UserRole.ADMIN,
        }),
      ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.CANNOT_UPDATE))
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
      expect(submittedInvoiceMock.histories[0]).toEqual({
        eventType: InvoiceEventType.EDITED,
        actor: mockPayload.user,
        changes: mockTrackedChanges.changes,
        createdAt: expect.any(Date),
      })
      expect(submittedInvoiceMock.save).toHaveBeenCalled()
      expect(result.updatedFields).toContain('amount')
    })

    it('should append one edited event and keep earlier entries, legacy ones included, unchanged', async () => {
      const earlierEntries = [
        { changes: { tax: { old: 5, new: 10 } }, createdAt: mockDate },
        {
          eventType: InvoiceEventType.CREATED,
          actor: mockPayload.user,
          createdAt: mockDate,
        },
      ]
      const submittedInvoiceMock = {
        ...mockInvoice,
        status: InvoiceStatus.SUBMITTED,
        histories: structuredClone(earlierEntries),
        save: jest.fn().mockResolvedValue(true),
      }
      ;(InvoiceModel.findOne as jest.Mock).mockResolvedValueOnce(
        submittedInvoiceMock,
      )
      ;(trackInvoiceChanges as jest.Mock).mockReturnValueOnce({
        updatedInvoice: { amount: 2000 },
        changes: { amount: { old: 1000, new: 2000 } },
      })

      await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: 2000,
      })

      expect(submittedInvoiceMock.histories).toHaveLength(3)
      expect(submittedInvoiceMock.histories.slice(0, 2)).toEqual(earlierEntries)
      expect(submittedInvoiceMock.histories[2].eventType).toBe(
        InvoiceEventType.EDITED,
      )
      expect(submittedInvoiceMock.save).toHaveBeenCalled()
    })

    it('should save a draft edit without recording an event', async () => {
      const draftInvoiceMock = {
        ...mockInvoice,
        status: InvoiceStatus.DRAFT,
        histories: [] as InvoiceHistory[],
        save: jest.fn().mockResolvedValue(true),
      }
      ;(InvoiceModel.findOne as jest.Mock).mockResolvedValueOnce(
        draftInvoiceMock,
      )
      ;(trackInvoiceChanges as jest.Mock).mockReturnValueOnce({
        updatedInvoice: { amount: 2000 },
        changes: { amount: { old: 1000, new: 2000 } },
      })

      const result = await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: 2000,
      })

      expect(draftInvoiceMock.save).toHaveBeenCalled()
      expect(draftInvoiceMock.histories).toHaveLength(0)
      expect(result.updatedFields).toEqual(['amount'])
    })

    it('should record nothing when a submitted invoice update changes no value', async () => {
      const submittedInvoiceMock = {
        ...mockInvoice,
        status: InvoiceStatus.SUBMITTED,
        histories: [] as InvoiceHistory[],
        save: jest.fn().mockResolvedValue(true),
      }
      ;(InvoiceModel.findOne as jest.Mock).mockResolvedValueOnce(
        submittedInvoiceMock,
      )
      ;(trackInvoiceChanges as jest.Mock).mockReturnValueOnce({
        updatedInvoice: { amount: mockInvoice.amount },
        changes: {},
      })

      const result = await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: mockInvoice.amount,
      })

      expect(submittedInvoiceMock.histories).toHaveLength(0)
      expect(result.updatedFields).toEqual([])
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

      // The deleted event is pushed in the same write as the soft delete
      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledTimes(1)
      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { invoiceNumber, isDeleted: { $ne: true } },
        {
          $set: { isDeleted: true },
          $push: {
            histories: {
              eventType: InvoiceEventType.DELETED,
              actor: mockPayload.user,
              createdAt: expect.any(Date),
            },
          },
        },
        { new: true },
      )
      expect(result).toEqual({ invoiceNumber, deleted: true })
    })

    it('should return 404 for detail and history once the invoice is deleted', async () => {
      ;(InvoiceModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })
      const reader = {
        invoiceNumber,
        userEmail: mockPayload.user,
        role: UserRole.USER,
      }

      await expect(
        invoiceService.getInvoiceByNumber(reader),
      ).rejects.toBeInstanceOf(NotFoundError)
      await expect(
        invoiceService.getInvoiceHistory(reader),
      ).rejects.toBeInstanceOf(NotFoundError)
      expect(InvoiceModel.findOne).toHaveBeenCalledWith({
        invoiceNumber,
        isDeleted: { $ne: true },
      })
    })

    // A concurrent delete flags the invoice first, so this write matches nothing
    it('should throw NotFoundError if the soft delete matches no live invoice', async () => {
      ;(InvoiceModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(mockInvoice),
      })
      ;(InvoiceModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(null),
      })

      await expect(
        invoiceService.deleteInvoice({
          invoiceNumber,
          userEmail: mockPayload.user,
        }),
      ).rejects.toBeInstanceOf(NotFoundError)
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

    it('should throw ForbiddenError when another non-admin user reads the history', async () => {
      ;(InvoiceModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(mockInvoice),
      })

      await expect(
        invoiceService.getInvoiceHistory({
          invoiceNumber,
          userEmail: 'other@example.com',
          role: UserRole.USER,
        }),
      ).rejects.toBeInstanceOf(ForbiddenError)
    })
  })

  // ================= HISTORY RESPONSE SHAPE =================
  describe('history entries in list, detail and history responses', () => {
    const invoiceNumber = mockInvoiceRaw.invoiceNumber
    const storedHistories = [
      // Legacy entries, stored before audit tracking
      {
        _id: 'h1',
        changes: { amount: { old: 500, new: 1000 } },
        createdAt: mockDate,
      },
      { _id: 'h2', eventType: null, changes: null, createdAt: mockDate },
      {
        _id: 'h3',
        eventType: InvoiceEventType.CREATED,
        // Email snapshot; the user may have changed it since
        actor: 'old.email@example.com',
        createdAt: mockDate,
      },
      {
        _id: 'h4',
        eventType: InvoiceEventType.EDITED,
        actor: 'old.email@example.com',
        changes: { tax: { old: 10, new: 20 } },
        createdAt: mockDate,
      },
    ]
    const iso = mockDate.toISOString()
    const expectedHistories = [
      {
        eventType: InvoiceEventType.EDITED,
        actor: null,
        changes: { amount: { old: 500, new: 1000 } },
        createdAt: iso,
        legacy: true,
      },
      {
        eventType: null,
        actor: null,
        changes: {},
        createdAt: iso,
        legacy: true,
      },
      {
        eventType: InvoiceEventType.CREATED,
        actor: 'old.email@example.com',
        changes: {},
        createdAt: iso,
      },
      {
        eventType: InvoiceEventType.EDITED,
        actor: 'old.email@example.com',
        changes: { tax: { old: 10, new: 20 } },
        createdAt: iso,
      },
    ]

    const storedInvoice = () => ({
      ...mockInvoice,
      histories: structuredClone(storedHistories),
    })

    const readAll = async (userEmail: string, role: UserRole) => {
      ;(InvoiceModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(storedInvoice()),
      })
      ;(InvoiceModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([storedInvoice()]),
      })
      ;(InvoiceModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const reader = { invoiceNumber, userEmail, role }
      const [list, detail, history] = await Promise.all([
        invoiceService.getInvoices({ userEmail, role, page: 1, limit: 10 }),
        invoiceService.getInvoiceByNumber(reader),
        invoiceService.getInvoiceHistory(reader),
      ])

      return {
        list: list.invoices[0].histories,
        detail: detail.histories,
        history: history.histories,
      }
    }

    it.each([
      ['the owner', mockInvoiceRaw.user, UserRole.USER],
      ['an admin', 'admin@example.com', UserRole.ADMIN],
    ])(
      'should return the same entries, oldest first, through all three responses to %s',
      async (_label, userEmail, role) => {
        const { list, detail, history } = await readAll(userEmail, role)

        expect(list).toEqual(expectedHistories)
        expect(detail).toEqual(expectedHistories)
        expect(history).toEqual(expectedHistories)
      },
    )

    it('should not write to the database or look actors up while reading', async () => {
      await readAll(mockInvoiceRaw.user, UserRole.USER)

      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
      expect(InvoiceModel.create).not.toHaveBeenCalled()
      expect(UserModel.findOne).not.toHaveBeenCalled()
      expect(UserModel.find).not.toHaveBeenCalled()
    })
  })
})
