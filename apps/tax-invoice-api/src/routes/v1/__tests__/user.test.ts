import express, { Router } from 'express'
import request from 'supertest'

// Routes
import { userRoutes } from '../user'

// Mock middlewares
const authenticateMock = jest.fn((_req, _res, next) => next())
const checkRoleMock = jest.fn((_role, _req, _res, next) => next())

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
const getMeMock = jest.fn((_req, res) => res.status(200).send('getMe called'))
const getUsersMock = jest.fn((_req, res) =>
  res.status(200).send('getUsers called'),
)

jest.mock('@/container', () => ({
  userController: {
    getMe: jest.fn((req, res) => getMeMock(req, res)),
    getUsers: jest.fn((req, res) => getUsersMock(req, res)),
  },
}))

describe('User Routes', () => {
  const app = express()
  app.use(express.json())

  const router = Router()
  userRoutes(router)
  app.use(router)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('GET /me should call getMe controller', async () => {
    const res = await request(app).get('/me')

    expect(authenticateMock).toHaveBeenCalled()
    expect(getMeMock).toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(res.text).toBe('getMe called')
  })

  it('GET /users should call getUsers with admin role check', async () => {
    const res = await request(app).get('/users')

    expect(authenticateMock).toHaveBeenCalled()
    expect(checkRoleMock).toHaveBeenCalled()
    expect(getUsersMock).toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(res.text).toBe('getUsers called')
  })
})
