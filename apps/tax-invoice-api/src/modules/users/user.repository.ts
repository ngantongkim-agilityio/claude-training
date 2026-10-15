import { UserModel } from '@/models'

// Types
import type { BaseRepository } from '@/core'
import { UserRole } from '@/types'
import type {
  CreateUserDTO,
  GetUsersInputDTO,
  GetUsersResponseDTO,
  UpdateUserDTO,
  UserEntity,
} from './user.dto'

export class UserRepository
  implements
    BaseRepository<
      UserEntity,
      CreateUserDTO,
      UpdateUserDTO,
      GetUsersInputDTO,
      string,
      GetUsersResponseDTO
    >
{
  async findById(id: string): Promise<UserEntity | null> {
    return UserModel.findById(id).lean<UserEntity>()
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return UserModel.findOne({ email }).lean<UserEntity>()
  }

  async findAll(options: GetUsersInputDTO = {}): Promise<GetUsersResponseDTO> {
    const { page = 1, limit = 10, email } = options

    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {
      role: {
        $ne: UserRole.ADMIN,
      },
    }

    if (email) {
      const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      filter.email = {
        $regex: escaped,
        $options: 'i',
      }
    }

    const [users, total] = await Promise.all([
      UserModel.find(filter, 'email role createdAt')
        .skip(skip)
        .limit(limit)
        .lean<UserEntity[]>(),
      UserModel.countDocuments(filter),
    ])

    return {
      users: users.map((user) => ({
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async create(data: CreateUserDTO): Promise<UserEntity> {
    const user = await UserModel.create(data)

    return user.toObject()
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserEntity | null> {
    return UserModel.findByIdAndUpdate(id, data, {
      new: true,
    }).lean<UserEntity>()
  }

  async softDelete(id: string): Promise<UserEntity | null> {
    return UserModel.findByIdAndUpdate(
      id,
      {
        deletedAt: new Date(),
      },
      {
        new: true,
      },
    ).lean<UserEntity>()
  }
}
