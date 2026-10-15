import express, { Router } from 'express'
import request from 'supertest'

// Routes
import { authRoutes } from '../auth'

// Mock controller methods
const registerMock = jest.fn((req, res) =>
  res.status(201).send('register called'),
)
const loginMock = jest.fn((req, res) => res.status(200).send('login called'))

jest.mock('@/container', () => ({
  authController: {
    register: jest.fn((req, res) => registerMock(req, res)),
    login: jest.fn((req, res) => loginMock(req, res)),
  },
}))

describe('Auth Routes', () => {
  const app = express()
  app.use(express.json())

  const router = Router()
  authRoutes(router)
  app.use(router)

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call register controller on POST /auth/register', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(registerMock).toHaveBeenCalled()
    expect(res.status).toBe(201)
    expect(res.text).toBe('register called')
  })

  it('should call login controller on POST /auth/login', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(loginMock).toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(res.text).toBe('login called')
  })
})
