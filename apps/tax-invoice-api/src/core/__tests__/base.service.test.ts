import { BaseService } from '../base.service'
import type { BaseRepository } from '../base.repository'
import { NotFoundError } from '@/utils'

type SampleInvoice = {
  invoiceNumber: string
  amount: number
  isDeleted: boolean
  createdBy?: string
  updatedBy?: string
}

type SampleCreateInvoiceDTO = {
  invoiceNumber: string
  amount: number
}

type SampleUpdateInvoiceDTO = {
  amount?: number
}

type SampleInvoiceFilter = {
  includeDeleted?: boolean
}

type SampleContext = {
  actor: string
}

class SampleInvoiceService extends BaseService<
  SampleInvoice,
  SampleCreateInvoiceDTO,
  SampleUpdateInvoiceDTO,
  SampleInvoiceFilter,
  string,
  SampleInvoice[],
  SampleContext
> {
  public afterCreateMock = jest.fn()
  public afterUpdateMock = jest.fn()

  constructor(
    repository: BaseRepository<
      SampleInvoice,
      SampleCreateInvoiceDTO,
      SampleUpdateInvoiceDTO,
      SampleInvoiceFilter,
      string,
      SampleInvoice[]
    >,
  ) {
    super(repository)
  }

  protected override beforeCreate(
    data: SampleCreateInvoiceDTO,
    context?: SampleContext,
  ): SampleCreateInvoiceDTO {
    return {
      ...data,
      amount: Math.round(data.amount),
      invoiceNumber: `${context?.actor ?? 'system'}-${data.invoiceNumber}`,
    }
  }

  protected override afterCreate(
    entity: SampleInvoice,
    data: SampleCreateInvoiceDTO,
    context?: SampleContext,
  ): void {
    this.afterCreateMock(entity, data, context)
  }

  protected override beforeUpdate(
    _id: string,
    data: SampleUpdateInvoiceDTO,
  ): SampleUpdateInvoiceDTO | void {
    if (data.amount === undefined) {
      return undefined
    }

    return {
      ...data,
      amount: Math.round(data.amount),
    }
  }

  protected override afterUpdate(
    entity: SampleInvoice,
    data: SampleUpdateInvoiceDTO,
    context?: SampleContext,
  ): void {
    this.afterUpdateMock(entity, data, context)
  }
}

describe('BaseService', () => {
  let repository: jest.Mocked<
    BaseRepository<
      SampleInvoice,
      SampleCreateInvoiceDTO,
      SampleUpdateInvoiceDTO,
      SampleInvoiceFilter,
      string,
      SampleInvoice[]
    >
  >
  let service: SampleInvoiceService

  const sampleInvoice: SampleInvoice = {
    invoiceNumber: 'INV-001',
    amount: 100,
    isDeleted: false,
  }

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    }

    service = new SampleInvoiceService(repository)
  })

  describe('findById', () => {
    it('should return entity when repository finds it', async () => {
      repository.findById.mockResolvedValueOnce(sampleInvoice)

      const result = await service.findById('INV-001')

      expect(repository.findById).toHaveBeenCalledWith('INV-001')
      expect(result).toEqual(sampleInvoice)
    })

    it('should throw NotFoundError when entity does not exist', async () => {
      repository.findById.mockResolvedValueOnce(null)

      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        NotFoundError,
      )
    })
  })

  describe('findAll', () => {
    it('should delegate filters to repository', async () => {
      const filter = { includeDeleted: true }
      repository.findAll.mockResolvedValueOnce([sampleInvoice])

      const result = await service.findAll(filter)

      expect(repository.findAll).toHaveBeenCalledWith(filter)
      expect(result).toEqual([sampleInvoice])
    })
  })

  describe('create', () => {
    it('should run hooks, create with transformed data, and return entity', async () => {
      const context = { actor: 'user@example.com' }
      const createdInvoice = {
        ...sampleInvoice,
        invoiceNumber: 'user@example.com-INV-001',
        createdBy: context.actor,
      }

      repository.create.mockResolvedValueOnce(createdInvoice)

      const result = await service.create(
        { invoiceNumber: 'INV-001', amount: 100.6 },
        context,
      )

      const transformedPayload = {
        invoiceNumber: 'user@example.com-INV-001',
        amount: 101,
      }

      expect(repository.create).toHaveBeenCalledWith(transformedPayload)
      expect(service.afterCreateMock).toHaveBeenCalledWith(
        createdInvoice,
        transformedPayload,
        context,
      )
      expect(result).toEqual(createdInvoice)
    })
  })

  describe('update', () => {
    it('should run hooks, update with transformed data, and return entity', async () => {
      const context = { actor: 'admin@example.com' }

      repository.findById.mockResolvedValueOnce(sampleInvoice)
      repository.update.mockResolvedValueOnce({ ...sampleInvoice, amount: 201 })

      const result = await service.update('INV-001', { amount: 200.9 }, context)

      expect(repository.findById).toHaveBeenCalledWith('INV-001')
      expect(repository.update).toHaveBeenCalledWith('INV-001', { amount: 201 })
      expect(result.amount).toBe(201)
    })

    it('should use original data when beforeUpdate returns void', async () => {
      const payload = {}

      repository.findById.mockResolvedValueOnce(sampleInvoice)
      repository.update.mockResolvedValueOnce(sampleInvoice)

      await service.update('INV-001', payload)

      expect(repository.update).toHaveBeenCalledWith('INV-001', undefined)
    })

    it('should throw NotFoundError when repository cannot update', async () => {
      repository.findById.mockResolvedValueOnce(sampleInvoice)
      repository.update.mockResolvedValueOnce(null)

      await expect(
        service.update('missing', { amount: 200 }),
      ).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe('softDelete', () => {
    it('should return soft deleted entity', async () => {
      const deletedInvoice = { ...sampleInvoice, isDeleted: true }
      repository.softDelete.mockResolvedValueOnce(deletedInvoice)

      const result = await service.softDelete('INV-001')

      expect(repository.softDelete).toHaveBeenCalledWith('INV-001')
      expect(result).toEqual(deletedInvoice)
    })

    it('should throw NotFoundError when repository cannot soft delete', async () => {
      repository.softDelete.mockResolvedValueOnce(null)

      await expect(service.softDelete('missing')).rejects.toBeInstanceOf(
        NotFoundError,
      )
    })
  })
})
