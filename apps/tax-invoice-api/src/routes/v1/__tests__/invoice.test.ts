import express, { Router } from 'express'
import request from 'supertest'

// Routes
import { invoiceRoutes } from '../invoice'

// Mock middlewares
const authenticateMock = jest.fn((req, res, next) => next())
const checkRoleMock = jest.fn((role, req, res, next) => next())

jest.mock('@/middlewares', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) =>
    authenticateMock(req, res, next),
  ),
  checkRole: jest.fn(
    (role: any) => (req: any, res: any, next: any) =>
      checkRoleMock(role, req, res, next),
  ),
}))

// Mock controllers
const createInvoiceMock = jest.fn((req, res) =>
  res.status(201).json({
    status: 'success',
    message: 'Created successfully',
    data: {
      invoiceNumber: 'INV-001',
      status: 'draft',
    },
  }),
)
const getInvoicesMock = jest.fn((req, res) =>
  res.status(200).json({
    status: 'success',
    message: 'Data fetched successfully',
    data: {
      invoices: [
        {
          invoiceNumber: 'INV-001',
          user: 'user@example.com',
          status: 'draft',
          amount: 100,
        },
      ],
    },
  }),
)
const getInvoiceByNumberMock = jest.fn((req, res) =>
  res.status(200).json({
    status: 'success',
    message: 'Data fetched successfully',
    data: {
      invoice: {
        invoiceNumber: 'INV-001',
        user: 'user@example.com',
        status: 'draft',
        amount: 100,
      },
    },
  }),
)
const updateInvoiceStatusMock = jest.fn((req, res) =>
  res.status(200).json({
    status: 'success',
    message: 'Updated successfully',
  }),
)
const updateInvoiceInfoMock = jest.fn((req, res) =>
  res.status(200).json({
    status: 'success',
    message: 'Updated successfully',
  }),
)
const deleteInvoiceMock = jest.fn((req, res) =>
  res.status(200).json({
    status: 'success',
    message: 'Deleted successfully',
  }),
)
const getInvoiceHistoryMock = jest.fn((req, res) =>
  res.status(200).json({
    status: 'success',
    message: 'Data fetched successfully',
    data: {
      histories: [
        {
          changes: { amount: { old: 100, new: 150 } },
          createdAt: '2025-07-15T10:30:00.000Z',
        },
      ],
    },
  }),
)

jest.mock('@/container', () => ({
  invoiceController: {
    createInvoice: jest.fn((req, res) => createInvoiceMock(req, res)),
    getInvoices: jest.fn((req, res) => getInvoicesMock(req, res)),
    getInvoiceByNumber: jest.fn((req, res) => getInvoiceByNumberMock(req, res)),
    updateInvoiceStatus: jest.fn((req, res) =>
      updateInvoiceStatusMock(req, res),
    ),
    updateInvoiceInfo: jest.fn((req, res) => updateInvoiceInfoMock(req, res)),
    deleteInvoice: jest.fn((req, res) => deleteInvoiceMock(req, res)),
    getInvoiceHistory: jest.fn((req, res) => getInvoiceHistoryMock(req, res)),
  },
}))

describe('Invoice Routes', () => {
  const app = express()
  app.use(express.json())

  const router = Router()
  invoiceRoutes(router)
  app.use(router)

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /invoices', () => {
    it('should call createInvoice controller with authentication', async () => {
      const res = await request(app).post('/invoices').send({
        amount: 100,
        tax: 10,
        description: 'Test invoice',
      })

      expect(authenticateMock).toHaveBeenCalled()
      expect(createInvoiceMock).toHaveBeenCalled()
      expect(res.status).toBe(201)
      expect(res.body.status).toBe('success')
      expect(res.body.data.invoiceNumber).toBe('INV-001')
      expect(res.body.data.status).toBe('draft')
    })
  })

  describe('GET /invoices', () => {
    it('should call getInvoices controller with authentication', async () => {
      const res = await request(app).get('/invoices')

      expect(authenticateMock).toHaveBeenCalled()
      expect(getInvoicesMock).toHaveBeenCalled()
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('success')
      expect(res.body.data.invoices).toHaveLength(1)
    })
  })

  describe('GET /invoices/:invoiceNumber', () => {
    it('should call getInvoiceByNumber controller with authentication', async () => {
      const res = await request(app).get('/invoices/INV-001')

      expect(authenticateMock).toHaveBeenCalled()
      expect(getInvoiceByNumberMock).toHaveBeenCalled()
      expect(res.status).toBe(200)
      expect(res.body.data.invoice.invoiceNumber).toBe('INV-001')
    })
  })

  describe('PATCH /invoices/:invoiceNumber', () => {
    it('should call updateInvoiceStatus controller with authentication', async () => {
      const res = await request(app)
        .patch('/invoices/INV-001')
        .send({ status: 'submitted' })

      expect(authenticateMock).toHaveBeenCalled()
      expect(updateInvoiceStatusMock).toHaveBeenCalled()
      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Updated successfully')
    })
  })

  describe('PUT /invoices/:invoiceNumber', () => {
    it('should call updateInvoiceInfo controller with authentication and role check', async () => {
      const res = await request(app).put('/invoices/INV-001').send({
        amount: 200,
        tax: 20,
        description: 'Updated invoice',
      })

      expect(authenticateMock).toHaveBeenCalled()
      expect(checkRoleMock).toHaveBeenCalled()
      expect(updateInvoiceInfoMock).toHaveBeenCalled()
      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Updated successfully')
    })
  })

  describe('DELETE /invoices/:invoiceNumber', () => {
    it('should call deleteInvoice controller with authentication and role check', async () => {
      const res = await request(app).delete('/invoices/INV-001')

      expect(authenticateMock).toHaveBeenCalled()
      expect(checkRoleMock).toHaveBeenCalled()
      expect(deleteInvoiceMock).toHaveBeenCalled()
      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Deleted successfully')
    })
  })

  describe('GET /invoices/:invoiceNumber/history', () => {
    it('should call getInvoiceHistory controller with authentication', async () => {
      const res = await request(app).get('/invoices/INV-001/history')

      expect(authenticateMock).toHaveBeenCalled()
      expect(getInvoiceHistoryMock).toHaveBeenCalled()
      expect(res.status).toBe(200)
      expect(res.body.data.histories).toHaveLength(1)
      expect(res.body.data.histories[0].changes.amount.old).toBe(100)
      expect(res.body.data.histories[0].changes.amount.new).toBe(150)
    })
  })
})
