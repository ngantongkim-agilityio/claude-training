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
import { InvoiceEventType, InvoiceStatus, UserRole } from '@/types'

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
    // The version read with the invoice; every write must be guarded on it
    const storedVersion = 4
    const rejectingAdmin = 'rejecting.admin@example.com'
    // What an admin's client sends back: the updatedAt of the version they reviewed
    const seenUpdatedAt = mockDate.toISOString()

    const givenStoredInvoice = (overrides: Record<string, unknown>) => {
      ;(InvoiceModel.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockInvoice,
        __v: storedVersion,
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
        {
          invoiceNumber,
          isDeleted: { $ne: true },
          status: fromStatus,
          __v: storedVersion,
        },
        {
          $set: { status: toStatus },
          $push: { histories: { ...event, createdAt: expect.any(Date) } },
          $inc: { __v: 1 },
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
        expectedUpdatedAt: seenUpdatedAt,
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
        expectedUpdatedAt: seenUpdatedAt,
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
          expectedUpdatedAt: seenUpdatedAt,
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
          expectedUpdatedAt: seenUpdatedAt,
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

    it('should throw ConflictError and write nothing when the invoice is approved', async () => {
      givenStoredInvoice({ status: InvoiceStatus.APPROVED })

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.SUBMITTED,
          userEmail: adminEmail,
          role: UserRole.ADMIN,
        }),
      ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.CANNOT_UPDATE))
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    // A rejected invoice is no longer final, so a transition it does not allow is 403 (T3-DQ1)
    it('should throw ForbiddenError INVALID_STATUS and write nothing when an admin submits a rejected invoice', async () => {
      givenStoredInvoice({ status: InvoiceStatus.REJECTED })

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.SUBMITTED,
          userEmail: adminEmail,
          role: UserRole.ADMIN,
        }),
      ).rejects.toEqual(new ForbiddenError(ERROR_MESSAGE.INVALID_STATUS))
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

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

    it('should throw ConflictError INVOICE_CHANGED when another request changed the invoice first', async () => {
      givenStoredInvoice({ status: InvoiceStatus.SUBMITTED })
      givenGuardedUpdate(null)

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.REJECTED,
          reason: 'Tax should be 10%',
          expectedUpdatedAt: seenUpdatedAt,
          userEmail: adminEmail,
          role: UserRole.ADMIN,
        }),
      ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.INVOICE_CHANGED))
    })

    // ---- KAN-6: rework of rejected invoices ----
    it('should record a resubmitted event when the owner resubmits a rejected invoice (TC-29)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.REJECTED })
      givenGuardedUpdate({ ...mockInvoice, status: InvoiceStatus.SUBMITTED })

      const result = await invoiceService.updateInvoiceStatus({
        invoiceNumber,
        status: InvoiceStatus.SUBMITTED,
        userEmail: mockPayload.user,
        role: UserRole.USER,
      })

      expectGuardedUpdate(InvoiceStatus.REJECTED, InvoiceStatus.SUBMITTED, {
        eventType: InvoiceEventType.RESUBMITTED,
        actor: mockPayload.user,
      })
      expect(result).toEqual({ invoiceNumber, status: InvoiceStatus.SUBMITTED })
    })

    it.each([
      ['another admin approves', 'second.admin@example.com', 'approved'],
      ['the rejecting admin rejects again', rejectingAdmin, 'rejected'],
    ])(
      'should let any admin decide a resubmitted invoice: %s (TC-30)',
      async (_label, adminActor, decision) => {
        givenStoredInvoice({
          status: InvoiceStatus.SUBMITTED,
          histories: [
            {
              eventType: InvoiceEventType.REJECTED,
              actor: rejectingAdmin,
              reason: 'Tax is wrong',
              createdAt: mockDate,
            },
            {
              eventType: InvoiceEventType.RESUBMITTED,
              actor: mockPayload.user,
              createdAt: mockDate,
            },
          ],
        })
        givenGuardedUpdate({ ...mockInvoice, status: decision })

        const result = await invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: decision as InvoiceStatus,
          ...(decision === 'rejected' && { reason: 'Still wrong' }),
          expectedUpdatedAt: seenUpdatedAt,
          userEmail: adminActor,
          role: UserRole.ADMIN,
        })

        expect(result.status).toBe(decision)
        expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledTimes(1)
      },
    )

    it('should throw ForbiddenError and write nothing when someone else resubmits a rejected invoice (TC-33)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.REJECTED })

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.SUBMITTED,
          userEmail: 'attacker@example.com',
          role: UserRole.USER,
        }),
      ).rejects.toEqual(new ForbiddenError(ERROR_MESSAGE.FORBIDDEN))
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it.each([
      [InvoiceStatus.APPROVED, UserRole.USER],
      [InvoiceStatus.REJECTED, UserRole.USER],
      [InvoiceStatus.DRAFT, UserRole.USER],
      [InvoiceStatus.APPROVED, UserRole.ADMIN],
      [InvoiceStatus.REJECTED, UserRole.ADMIN],
      [InvoiceStatus.DRAFT, UserRole.ADMIN],
    ])(
      'should throw 403 INVALID_STATUS and write nothing for %s on a rejected invoice by a %s (TC-36)',
      async (status, role) => {
        givenStoredInvoice({ status: InvoiceStatus.REJECTED })

        await expect(
          invoiceService.updateInvoiceStatus({
            invoiceNumber,
            status,
            ...(status === InvoiceStatus.REJECTED && { reason: 'Still wrong' }),
            expectedUpdatedAt: seenUpdatedAt,
            userEmail: role === UserRole.ADMIN ? adminEmail : mockPayload.user,
            role,
          }),
        ).rejects.toEqual(new ForbiddenError(ERROR_MESSAGE.INVALID_STATUS))
        expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
      },
    )

    it('should guard a resubmit on a missing __v when the stored invoice has none (TC-35)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.REJECTED, __v: undefined })
      givenGuardedUpdate({ ...mockInvoice, status: InvoiceStatus.SUBMITTED })

      await invoiceService.updateInvoiceStatus({
        invoiceNumber,
        status: InvoiceStatus.SUBMITTED,
        userEmail: mockPayload.user,
        role: UserRole.USER,
      })

      // An undefined value would be dropped from the filter and disable the guard
      expect(
        (InvoiceModel.findOneAndUpdate as jest.Mock).mock.calls[0][0],
      ).toMatchObject({ __v: { $exists: false } })
    })

    it('should keep an approved invoice final for the owner (TC-34)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.APPROVED })

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.SUBMITTED,
          userEmail: mockPayload.user,
          role: UserRole.USER,
        }),
      ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.CANNOT_UPDATE))
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should throw INVOICE_CHANGED with the exact message and write nothing when an approval is stale (TC-62)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.SUBMITTED })

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.APPROVED,
          expectedUpdatedAt: '2026-06-22T09:59:59.000Z',
          userEmail: adminEmail,
          role: UserRole.ADMIN,
        }),
      ).rejects.toEqual(
        new ConflictError(
          'This invoice has changed since you opened it. Reload it to review the latest version.',
        ),
      )
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should throw INVOICE_CHANGED and write nothing when a rejection is stale (TC-63)', async () => {
      givenStoredInvoice({
        status: InvoiceStatus.SUBMITTED,
        updatedAt: new Date('2026-06-22T10:05:00.000Z'),
      })

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.REJECTED,
          reason: 'Tax is wrong',
          expectedUpdatedAt: seenUpdatedAt,
          userEmail: adminEmail,
          role: UserRole.ADMIN,
        }),
      ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.INVOICE_CHANGED))
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    // The stale check sits before the approved and transition checks (D3)
    it('should answer a stale decision with INVOICE_CHANGED, not 409 CANNOT_UPDATE or 403 (TC-65)', async () => {
      const stale = '2026-06-22T09:00:00.000Z'

      for (const status of [InvoiceStatus.APPROVED, InvoiceStatus.REJECTED]) {
        givenStoredInvoice({ status })
        await expect(
          invoiceService.updateInvoiceStatus({
            invoiceNumber,
            status: InvoiceStatus.APPROVED,
            expectedUpdatedAt: stale,
            userEmail: adminEmail,
            role: UserRole.ADMIN,
          }),
        ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.INVOICE_CHANGED))
      }

      // With a current timestamp the later checks apply again
      givenStoredInvoice({ status: InvoiceStatus.APPROVED })
      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.APPROVED,
          expectedUpdatedAt: seenUpdatedAt,
          userEmail: adminEmail,
          role: UserRole.ADMIN,
        }),
      ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.CANNOT_UPDATE))
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should not let the stale check hide a permission failure (TC-65)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.SUBMITTED })

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.APPROVED,
          expectedUpdatedAt: '2026-06-22T09:00:00.000Z',
          userEmail: mockPayload.user,
          role: UserRole.USER,
        }),
      ).rejects.toEqual(new ForbiddenError(ERROR_MESSAGE.INVALID_STATUS))
    })

    // Legacy rejected invoices were rejected before events and versioned writes existed
    it('should resubmit a legacy rejected invoice with one resubmitted event and invent no rejected event (TC-35)', async () => {
      givenStoredInvoice({
        status: InvoiceStatus.REJECTED,
        histories: [
          { changes: { tax: { old: 5, new: 10 } }, createdAt: mockDate },
        ],
      })
      givenGuardedUpdate({ ...mockInvoice, status: InvoiceStatus.SUBMITTED })

      await invoiceService.updateInvoiceStatus({
        invoiceNumber,
        status: InvoiceStatus.SUBMITTED,
        userEmail: mockPayload.user,
        role: UserRole.USER,
      })

      expectGuardedUpdate(InvoiceStatus.REJECTED, InvoiceStatus.SUBMITTED, {
        eventType: InvoiceEventType.RESUBMITTED,
        actor: mockPayload.user,
      })
    })

    it('should throw INVOICE_CHANGED when a legacy rejected invoice loses a write race (TC-35)', async () => {
      givenStoredInvoice({
        status: InvoiceStatus.REJECTED,
        histories: [{ changes: {}, createdAt: mockDate }],
      })
      givenGuardedUpdate(null)

      await expect(
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.SUBMITTED,
          userEmail: mockPayload.user,
          role: UserRole.USER,
        }),
      ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.INVOICE_CHANGED))
      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledTimes(1)
    })
  })

  // ================= UPDATE INFO & HISTORIES =================
  describe('updateInvoiceInfo', () => {
    const invoiceNumber = mockInvoiceRaw.invoiceNumber
    // The version read with the invoice; the write must be guarded on it
    const storedVersion = 2

    const givenStoredInvoice = (overrides: Record<string, unknown>) => {
      ;(InvoiceModel.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockInvoice,
        __v: storedVersion,
        ...overrides,
      })
    }

    const givenTrackedChanges = (changes: Record<string, unknown>) => {
      ;(trackInvoiceChanges as jest.Mock).mockReturnValueOnce({
        updatedInvoice: {},
        changes,
      })
    }

    // The guarded update returns the updated invoice, or null when nothing matched
    const givenGuardedUpdate = (result: Record<string, unknown> | null) => {
      ;(InvoiceModel.findOneAndUpdate as jest.Mock).mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(result),
      })
    }

    const expectGuardedUpdate = (
      set: Record<string, unknown>,
      event?: Record<string, unknown>,
    ) => {
      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledTimes(1)
      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { invoiceNumber, isDeleted: { $ne: true }, __v: storedVersion },
        {
          $set: set,
          ...(event && {
            $push: { histories: { ...event, createdAt: expect.any(Date) } },
          }),
          $inc: { __v: 1 },
        },
        { new: true, runValidators: true },
      )
    }

    const amountChange = { amount: { old: 1000, new: 2000 } }

    it('should log audit changes on histories array when modification hits SUBMITTED states', async () => {
      givenStoredInvoice({ status: InvoiceStatus.SUBMITTED })
      givenTrackedChanges(amountChange)
      givenGuardedUpdate({ ...mockInvoice, status: InvoiceStatus.SUBMITTED })

      const result = await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: 2000,
      })

      expectGuardedUpdate(
        { amount: 2000 },
        {
          eventType: InvoiceEventType.EDITED,
          actor: mockPayload.user,
          changes: amountChange,
        },
      )
      expect(result.updatedFields).toContain('amount')
    })

    it('should append one edited event without touching earlier entries, legacy ones included', async () => {
      givenStoredInvoice({
        status: InvoiceStatus.SUBMITTED,
        histories: [
          { changes: { tax: { old: 5, new: 10 } }, createdAt: mockDate },
        ],
      })
      givenTrackedChanges(amountChange)
      givenGuardedUpdate({ ...mockInvoice })

      await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: 2000,
      })

      // Earlier entries are never rewritten: the event is appended with $push only
      const update = (InvoiceModel.findOneAndUpdate as jest.Mock).mock
        .calls[0][1]
      expect(update.$push.histories.eventType).toBe(InvoiceEventType.EDITED)
      expect(update.$set).not.toHaveProperty('histories')
    })

    it('should save a draft edit without recording an event', async () => {
      givenStoredInvoice({ status: InvoiceStatus.DRAFT })
      givenTrackedChanges(amountChange)
      givenGuardedUpdate({ ...mockInvoice })

      const result = await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: 2000,
      })

      expectGuardedUpdate({ amount: 2000 })
      expect(result.updatedFields).toEqual(['amount'])
    })

    it('should write nothing when a submitted invoice update changes no value', async () => {
      givenStoredInvoice({ status: InvoiceStatus.SUBMITTED })
      givenTrackedChanges({})

      const result = await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: mockInvoice.amount,
      })

      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
      expect(result.updatedFields).toEqual([])
    })

    it('should let the owner edit a rejected invoice, keep it rejected and record an edited event (TC-04, TC-27)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.REJECTED })
      givenTrackedChanges(amountChange)
      givenGuardedUpdate({ ...mockInvoice, status: InvoiceStatus.REJECTED })

      const result = await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: 2000,
      })

      // Only the changed field is set, so the status stays rejected
      expectGuardedUpdate(
        { amount: 2000 },
        {
          eventType: InvoiceEventType.EDITED,
          actor: mockPayload.user,
          changes: amountChange,
        },
      )
      expect(result).toEqual({
        invoiceNumber,
        updatedFields: ['amount'],
      })
    })

    it('should record no event and write nothing when a rejected invoice edit changes no value (TC-27)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.REJECTED })
      givenTrackedChanges({})

      const result = await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: mockInvoice.amount,
      })

      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
      expect(result.updatedFields).toEqual([])
    })

    it.each([
      ['another user', 'attacker@example.com'],
      ['an admin', 'admin@example.com'],
    ])(
      'should throw ForbiddenError and write nothing when %s edits a rejected invoice (TC-33)',
      async (_label, userEmail) => {
        givenStoredInvoice({ status: InvoiceStatus.REJECTED })

        await expect(
          invoiceService.updateInvoiceInfo({
            invoiceNumber,
            userEmail,
            amount: 2000,
          }),
        ).rejects.toEqual(new ForbiddenError(ERROR_MESSAGE.FORBIDDEN))
        expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
      },
    )

    it('should keep an approved invoice final for edits (TC-34)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.APPROVED })

      await expect(
        invoiceService.updateInvoiceInfo({
          invoiceNumber,
          userEmail: mockPayload.user,
          amount: 2000,
        }),
      ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.CANNOT_UPDATE))
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should edit a legacy rejected invoice and append only an edited event (TC-35)', async () => {
      givenStoredInvoice({
        status: InvoiceStatus.REJECTED,
        histories: [{ changes: {}, createdAt: mockDate }],
      })
      givenTrackedChanges(amountChange)
      givenGuardedUpdate({ ...mockInvoice })

      await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: 2000,
      })

      const update = (InvoiceModel.findOneAndUpdate as jest.Mock).mock
        .calls[0][1]
      expect(update.$push.histories.eventType).toBe(InvoiceEventType.EDITED)
    })

    it.each([
      InvoiceStatus.DRAFT,
      InvoiceStatus.SUBMITTED,
      InvoiceStatus.REJECTED,
    ])(
      'should throw INVOICE_CHANGED and make no second write when the guarded %s edit matches nothing (TC-66)',
      async (status) => {
        givenStoredInvoice({ status })
        givenTrackedChanges(amountChange)
        givenGuardedUpdate(null)

        await expect(
          invoiceService.updateInvoiceInfo({
            invoiceNumber,
            userEmail: mockPayload.user,
            amount: 2000,
          }),
        ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.INVOICE_CHANGED))
        expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledTimes(1)
      },
    )

    it('should guard an edit on a missing __v when the stored invoice has none (TC-35)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.REJECTED, __v: undefined })
      givenTrackedChanges(amountChange)
      givenGuardedUpdate({ ...mockInvoice })

      await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        amount: 2000,
      })

      expect(
        (InvoiceModel.findOneAndUpdate as jest.Mock).mock.calls[0][0],
      ).toMatchObject({ __v: { $exists: false } })
    })
  })

  // ================= DELETE =================
  describe('deleteInvoice', () => {
    const invoiceNumber = mockInvoiceRaw.invoiceNumber
    // The version read with the invoice; the soft delete must be guarded on it
    const storedVersion = 6

    const givenStoredInvoice = (overrides: Record<string, unknown> = {}) => {
      ;(InvoiceModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce({
          ...mockInvoice,
          __v: storedVersion,
          ...overrides,
        }),
      })
    }

    const expectGuardedSoftDelete = () => {
      // The deleted event is pushed in the same write as the soft delete
      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledTimes(1)
      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { invoiceNumber, isDeleted: { $ne: true }, __v: storedVersion },
        {
          $set: { isDeleted: true },
          $push: {
            histories: {
              eventType: InvoiceEventType.DELETED,
              actor: mockPayload.user,
              createdAt: expect.any(Date),
            },
          },
          $inc: { __v: 1 },
        },
        { new: true },
      )
    }

    it('should let owners execute soft-delete if current state remains flexible', async () => {
      givenStoredInvoice()
      ;(InvoiceModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValueOnce({ ...mockInvoice, isDeleted: true }), // Repository.softDelete call
      })

      const result = await invoiceService.deleteInvoice({
        invoiceNumber,
        userEmail: mockPayload.user,
      })

      expectGuardedSoftDelete()
      expect(result).toEqual({ invoiceNumber, deleted: true })
    })

    it('should guard a delete on a missing __v when the stored invoice has none (TC-35)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.REJECTED, __v: undefined })
      ;(InvoiceModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValueOnce({ ...mockInvoice, isDeleted: true }),
      })

      await invoiceService.deleteInvoice({
        invoiceNumber,
        userEmail: mockPayload.user,
      })

      expect(
        (InvoiceModel.findOneAndUpdate as jest.Mock).mock.calls[0][0],
      ).toMatchObject({ __v: { $exists: false } })
    })

    it('should let the owner delete a rejected invoice (TC-32)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.REJECTED })
      ;(InvoiceModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValueOnce({ ...mockInvoice, isDeleted: true }),
      })

      const result = await invoiceService.deleteInvoice({
        invoiceNumber,
        userEmail: mockPayload.user,
      })

      expectGuardedSoftDelete()
      expect(result).toEqual({ invoiceNumber, deleted: true })
    })

    it('should throw ForbiddenError and write nothing when someone else deletes a rejected invoice (TC-33)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.REJECTED })

      await expect(
        invoiceService.deleteInvoice({
          invoiceNumber,
          userEmail: 'attacker@example.com',
        }),
      ).rejects.toEqual(new ForbiddenError(ERROR_MESSAGE.FORBIDDEN))
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
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

    // A concurrent delete or edit bumps the version first, so this write matches nothing
    it('should throw INVOICE_CHANGED if the guarded soft delete matches nothing (TC-66)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.REJECTED })
      ;(InvoiceModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(null),
      })

      await expect(
        invoiceService.deleteInvoice({
          invoiceNumber,
          userEmail: mockPayload.user,
        }),
      ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.INVOICE_CHANGED))
      expect(InvoiceModel.findOneAndUpdate).toHaveBeenCalledTimes(1)
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

    it('should keep 409 CANNOT_DELETE and write nothing for an approved invoice (TC-34)', async () => {
      givenStoredInvoice({ status: InvoiceStatus.APPROVED })

      await expect(
        invoiceService.deleteInvoice({
          invoiceNumber,
          userEmail: mockPayload.user,
        }),
      ).rejects.toEqual(new ConflictError(ERROR_MESSAGE.CANNOT_DELETE))
      expect(InvoiceModel.findOneAndUpdate).not.toHaveBeenCalled()
    })
  })

  // ================= REWORK CYCLES (stateful fake) =================
  // A tiny in-memory stand-in for the guarded writes, so a whole reject / resubmit
  // loop runs through the real service and repository and the stored events can be read back.
  describe('reject and resubmit cycles', () => {
    const invoiceNumber = mockInvoiceRaw.invoiceNumber
    const adminEmail = 'admin@example.com'
    let stored: any
    let clock: number

    beforeEach(() => {
      clock = mockDate.getTime()
      stored = {
        ...mockInvoiceRaw,
        status: InvoiceStatus.SUBMITTED,
        __v: 0,
        histories: [],
        updatedAt: new Date(clock),
      }
      ;(InvoiceModel.findOne as jest.Mock).mockImplementation(async () => ({
        ...stored,
        histories: [...stored.histories],
      }))
      ;(InvoiceModel.findOneAndUpdate as jest.Mock).mockImplementation(
        (filter: any, update: any) => ({
          lean: async () => {
            const versionMoved = filter.__v !== stored.__v
            const statusMoved =
              filter.status !== undefined && filter.status !== stored.status
            if (versionMoved || statusMoved) return null
            Object.assign(stored, update.$set)
            if (update.$push) stored.histories.push(update.$push.histories)
            stored.__v += update.$inc.__v
            clock += 1000
            stored.updatedAt = new Date(clock)
            return { ...stored }
          },
        }),
      )
    })

    afterEach(() => {
      ;(InvoiceModel.findOne as jest.Mock).mockReset()
      ;(InvoiceModel.findOneAndUpdate as jest.Mock).mockReset()
    })

    it('should keep one invoice number and record six events over three reject and resubmit cycles (TC-28, TC-29, TC-31)', async () => {
      for (let cycle = 1; cycle <= 3; cycle++) {
        await invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.REJECTED,
          reason: `Round ${cycle}`,
          expectedUpdatedAt: stored.updatedAt.toISOString(),
          userEmail: adminEmail,
          role: UserRole.ADMIN,
        })
        await invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.SUBMITTED,
          userEmail: mockPayload.user,
          role: UserRole.USER,
        })
      }

      expect(stored.invoiceNumber).toBe(invoiceNumber)
      expect(stored.status).toBe(InvoiceStatus.SUBMITTED)
      expect(stored.histories.map((h: any) => h.eventType)).toEqual([
        InvoiceEventType.REJECTED,
        InvoiceEventType.RESUBMITTED,
        InvoiceEventType.REJECTED,
        InvoiceEventType.RESUBMITTED,
        InvoiceEventType.REJECTED,
        InvoiceEventType.RESUBMITTED,
      ])
    })

    it('should let the owner edit between rejection and resubmission without leaving rejected (TC-27, TC-28)', async () => {
      await invoiceService.updateInvoiceStatus({
        invoiceNumber,
        status: InvoiceStatus.REJECTED,
        reason: 'Tax is wrong',
        expectedUpdatedAt: stored.updatedAt.toISOString(),
        userEmail: adminEmail,
        role: UserRole.ADMIN,
      })
      ;(trackInvoiceChanges as jest.Mock).mockReturnValueOnce({
        updatedInvoice: {},
        changes: { tax: { old: 10, new: 20 } },
      })

      await invoiceService.updateInvoiceInfo({
        invoiceNumber,
        userEmail: mockPayload.user,
        tax: 20,
      })

      expect(stored.status).toBe(InvoiceStatus.REJECTED)
      expect(stored.tax).toBe(20)
      expect(stored.histories.map((h: any) => h.eventType)).toEqual([
        InvoiceEventType.REJECTED,
        InvoiceEventType.EDITED,
      ])
    })

    // Both requests read the same version; only the first write can match it
    it('should let one of two simultaneous saves succeed and answer the other INVOICE_CHANGED (TC-66)', async () => {
      await invoiceService.updateInvoiceStatus({
        invoiceNumber,
        status: InvoiceStatus.REJECTED,
        reason: 'Tax is wrong',
        expectedUpdatedAt: stored.updatedAt.toISOString(),
        userEmail: adminEmail,
        role: UserRole.ADMIN,
      })
      ;(trackInvoiceChanges as jest.Mock).mockReturnValueOnce({
        updatedInvoice: {},
        changes: { tax: { old: 10, new: 20 } },
      })

      const results = await Promise.allSettled([
        invoiceService.updateInvoiceInfo({
          invoiceNumber,
          userEmail: mockPayload.user,
          tax: 20,
        }),
        invoiceService.updateInvoiceStatus({
          invoiceNumber,
          status: InvoiceStatus.SUBMITTED,
          userEmail: mockPayload.user,
          role: UserRole.USER,
        }),
      ])

      expect(results.map((r) => r.status).sort()).toEqual([
        'fulfilled',
        'rejected',
      ])
      const failure = results.find((r) => r.status === 'rejected') as
        PromiseRejectedResult | undefined
      expect(failure?.reason).toEqual(
        new ConflictError(ERROR_MESSAGE.INVOICE_CHANGED),
      )
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
