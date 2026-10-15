import express, { Router } from 'express'
import request from 'supertest'

// Routes
import { baseRoutes } from '../base'

describe('Index Route', () => {
  let app: express.Express

  beforeAll(() => {
    app = express()
    const router = Router()
    baseRoutes(router)
    app.use(router)
  })

  it('GET / should return API status message', async () => {
    const res = await request(app).get('/')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'Tax Invoices Manager API' })
  })
})
