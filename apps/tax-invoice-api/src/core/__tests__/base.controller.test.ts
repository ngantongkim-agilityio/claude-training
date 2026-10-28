import type { NextFunction, Request, Response } from 'express'

import { STATUS_CODE } from '@/constants'
import { responseCreated, responseOk } from '@/utils'

import { BaseController } from '../base.controller'

jest.mock('@/utils', () => ({
  ...jest.requireActual('@/utils'),
  responseOk: jest.fn(),
  responseCreated: jest.fn(),
}))

class SampleInvoiceController extends BaseController {
  public sendOk(res: Response, data?: Record<string, unknown>): void {
    this.ok(res, 'Fetched successfully', data)
  }

  public sendCreated(res: Response, data?: Record<string, unknown>): void {
    this.created(res, 'Created successfully', data)
  }

  public sendNoContent(res: Response): void {
    this.noContent(res)
  }

  public wrap(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  ) {
    return this.asyncHandler(handler)
  }
}

type MockRes = Partial<Response> & {
  status: jest.Mock
  send: jest.Mock
}

describe('BaseController', () => {
  let controller: SampleInvoiceController
  let res: MockRes

  beforeEach(() => {
    controller = new SampleInvoiceController()
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    }
  })

  describe('ok', () => {
    it('should delegate to standard OK response helper', () => {
      const data = { invoiceNumber: 'INV-001' }

      controller.sendOk(res as Response, data)

      expect(responseOk).toHaveBeenCalledWith(res, 'Fetched successfully', data)
    })
  })

  describe('created', () => {
    it('should delegate to standard created response helper', () => {
      const data = { invoiceNumber: 'INV-001' }

      controller.sendCreated(res as Response, data)

      expect(responseCreated).toHaveBeenCalledWith(
        res,
        'Created successfully',
        data,
      )
    })
  })

  describe('noContent', () => {
    it('should send HTTP 204 with no body', () => {
      controller.sendNoContent(res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS_CODE.NO_CONTENT)
      expect(res.send).toHaveBeenCalledWith()
    })
  })

  describe('asyncHandler', () => {
    it('should call wrapped async handler', async () => {
      const req = {} as Request
      const next = jest.fn()
      const handler = jest.fn().mockResolvedValueOnce(undefined)
      const wrappedHandler = controller.wrap(handler)

      await wrappedHandler(req, res as Response, next)

      expect(handler).toHaveBeenCalledWith(req, res, next)
      expect(next).not.toHaveBeenCalled()
    })

    it('should forward rejected errors to next', async () => {
      const req = {} as Request
      const next = jest.fn()
      const error = new Error('Unexpected failure')
      const handler = jest.fn().mockRejectedValueOnce(error)
      const wrappedHandler = controller.wrap(handler)

      await wrappedHandler(req, res as Response, next)
      await Promise.resolve()

      expect(next).toHaveBeenCalledWith(error)
    })
  })
})
