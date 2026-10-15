import { NotFoundError } from '@/utils'
import type { BaseRepository } from './base.repository'

type MaybePromise<T> = T | Promise<T>

/**
 * Abstract Base Service implementing core business logic orchestrations.
 * Bridges the gap between incoming DTOs (from controllers) and the Repository layer.
 */
export abstract class BaseService<
  TEntity,
  TCreateDTO,
  TUpdateDTO,
  TFindAllOptions = unknown,
  TId = string,
  TFindAllResult = TEntity[],
  TContext = unknown,
> {
  protected constructor(
    // The repository generic parameters map safely to avoid strict coupling with Client DTOs
    protected readonly repository: BaseRepository<
      TEntity,
      any,
      any,
      TFindAllOptions,
      TId,
      TFindAllResult
    >,
  ) {}

  /**
   * Finds an entity by ID. Throws NotFoundError if the record is missing.
   */
  async findById(id: TId): Promise<TEntity> {
    const entity = await this.repository.findById(id)

    if (!entity) {
      throw new NotFoundError()
    }

    return entity
  }

  /**
   * Fetches multiple entities based on specific query options.
   */
  async findAll(options?: TFindAllOptions): Promise<TFindAllResult> {
    return this.repository.findAll(options)
  }

  /**
   * Core logic for creating an entity. Executes lifecycle hooks around the database save operation.
   */
  async create(data: TCreateDTO, context?: TContext): Promise<TEntity> {
    // Transform or enrich incoming DTO data before hits the DB
    const preparedData = await this.beforeCreate(data, context)
    const entity = await this.repository.create(preparedData)

    // Execute side-effects (e.g., dispatch events, send notifications)
    await this.afterCreate(entity, preparedData, context)

    return entity
  }

  /**
   * Core logic for updating an entity.
   * Guarantees that the record exists before triggering modifications.
   */
  async update(
    id: TId,
    data: TUpdateDTO,
    context?: TContext,
  ): Promise<TEntity> {
    // 1. Fail-Fast: Ensure record exists before spending resources on preprocessing hooks
    const currentEntity = await this.findById(id)

    // 2. Preprocess: Pass the fresh entity data so hooks can compute logs/deltas
    const preparedData = await this.beforeUpdate(
      id,
      data,
      currentEntity,
      context,
    )

    const updatedEntity = await this.repository.update(id, preparedData)

    if (!updatedEntity) {
      throw new NotFoundError()
    }

    // 3. Post-process side effects
    await this.afterUpdate(updatedEntity, preparedData, context)

    return updatedEntity
  }

  /**
   * Standard soft delete pipeline.
   */
  async softDelete(id: TId, _context?: TContext): Promise<TEntity> {
    const entity = await this.repository.softDelete(id)

    if (!entity) {
      throw new NotFoundError()
    }

    return entity
  }

  /**
   * Hook executed before the entity creation. Use this to hash passwords or format fields.
   * Must return the transformed data structure intended for the repository.
   */
  protected beforeCreate(
    data: TCreateDTO,
    _context?: TContext,
  ): MaybePromise<any> {
    return data
  }

  /**
   * Hook executed after the entity has been successfully created.
   */
  protected afterCreate(
    _entity: TEntity,
    _data: any,
    _context?: TContext,
  ): MaybePromise<void> {}

  /**
   * Hook executed before the update process. Receives the actual database record (`currentEntity`)
   * to calculate structural changes or run entity-specific state constraints.
   */
  protected beforeUpdate(
    _id: TId,
    data: TUpdateDTO,
    _currentEntity: TEntity,
    _context?: TContext,
  ): MaybePromise<any> {
    return data
  }

  /**
   * Hook executed after the entity has been successfully updated.
   */
  protected afterUpdate(
    _entity: TEntity,
    _data: any,
    _context?: TContext,
  ): MaybePromise<void> {}
}
