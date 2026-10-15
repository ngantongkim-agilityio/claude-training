import express, { Router } from 'express'

// Routes
import { reportRoutes } from '../report'

// Mock middlewares
const authenticateMock = jest.fn((_req, _res, next) => next())

jest.mock('@/middlewares', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) =>
    authenticateMock(req, res, next),
  ),
}))

jest.mock('@/container', () => ({
  reportController: {
    getInvoicesByFilter: jest.fn((_req, res) =>
      res.status(200).json({ status: 'success' }),
    ),
    exportPdf: jest.fn((_req, res) =>
      res.status(200).end(),
    ),
    emailReport: jest.fn((_req, res) =>
      res.status(202).json({ status: 'success' }),
    ),
  },
}))

describe('Report Routes', () => {
  const app = express()
  app.use(express.json())
  const router = Router()
  reportRoutes(router)
  app.use(router)

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /reports/invoices', () => {
    it('should register the GET route correctly', () => {
      const router = Router()
      const routerSpy = jest.spyOn(router, 'get')

      reportRoutes(router)

      expect(routerSpy).toHaveBeenCalledWith(
        '/reports/invoices',
        expect.any(Function),
        expect.any(Function),
      )
    })
  })

  describe('POST /reports/invoices/pdf', () => {
    it('should register the export PDF route correctly', () => {
      const router = Router()
      const routerSpy = jest.spyOn(router, 'post')

      reportRoutes(router)

      expect(routerSpy).toHaveBeenCalledWith(
        '/reports/invoices/pdf',
        expect.any(Function),
        expect.any(Function),
      )
    })
  })

  describe('POST /reports/invoices/email', () => {
    it('should register the email report route correctly', () => {
      const router = Router()
      const routerSpy = jest.spyOn(router, 'post')

      reportRoutes(router)

      expect(routerSpy).toHaveBeenCalledWith(
        '/reports/invoices/email',
        expect.any(Function),
        expect.any(Function),
      )
    })
  })
})
