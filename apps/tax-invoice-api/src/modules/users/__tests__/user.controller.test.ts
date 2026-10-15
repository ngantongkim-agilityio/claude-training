import { Request, Response, NextFunction } from 'express'

// Controllers
import { UserController } from '../user.controller'

// Constants
import { SUCCESS_MESSAGE } from '@/constants'

// Types
import { UserRole } from '@/types'

// Mock the user service module completely
jest.mock('../user.service', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    findAll: jest.fn(),
  })),
}))

describe('UserController', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction
  let userController: UserController
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userService: any

  const mockUser = {
    email: 'test@example.com',
    role: UserRole.USER,
  }

  beforeEach(() => {
    // Sync with the actual implementation method names from BaseService
    userService = {
      findAll: jest.fn(),
    }

    userController = new UserController(userService)

    req = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentUser: mockUser as any,
      query: {},
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    // Mock NextFunction to fulfill Express RequestHandler signature requirement
    next = jest.fn()

    jest.clearAllMocks()
  })

  describe('getMe', () => {
    it('should return current user from identity token context via BaseController response wrapper', async () => {
      await userController.getMe(req as Request, res as Response, next)

      // Verifies response layout generated smoothly inside this.ok wrapper
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.FETCH_SUCCESS,
        data: {
          email: mockUser.email,
          role: mockUser.role,
        },
      })
    })
  })

  describe('getUsers', () => {
    it('should pass validated query filters to service.findAll and wrap paginated payload correctly', async () => {
      const mockPaginatedResult = {
        users: [
          {
            email: 'test@example.com',
            role: UserRole.USER,
            createdAt: '2026-06-22T10:00:00.000Z',
          },
          {
            email: 'test2@example.com',
            role: UserRole.USER,
            createdAt: '2026-06-22T10:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      }

      req.query = { page: '1', limit: '10', email: 'test' }
      ;(userService.findAll as jest.Mock).mockResolvedValueOnce(
        mockPaginatedResult,
      )

      await userController.getUsers(req as Request, res as Response, next)

      // Ensures controller captures the request payload mapping perfectly
      expect(userService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        email: 'test',
      })

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.FETCH_SUCCESS,
        data: mockPaginatedResult,
      })
    })

    it('should gracefully utilize schema default fallbacks when pagination queries are missing', async () => {
      const mockPaginatedResult = {
        users: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }

      req.query = {} // Empty query params trigger schema defaults inside parseRequest
      ;(userService.findAll as jest.Mock).mockResolvedValueOnce(
        mockPaginatedResult,
      )

      await userController.getUsers(req as Request, res as Response, next)

      expect(userService.findAll).toHaveBeenCalledWith({})

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: SUCCESS_MESSAGE.FETCH_SUCCESS,
        data: mockPaginatedResult,
      })
    })
  })
})
