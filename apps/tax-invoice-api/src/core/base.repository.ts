export type EntityId = string

/**
 * Generic Base Repository Interface.
 * Defines the contract for standard Data Access Object (DAO) operations.
 * * @template TEntity The core database entity/domain model.
 * @template TCreateInput The data structure required to create a new record.
 * @template TRepositoryUpdate The data structure required to update a record (defaults to Partial<TEntity>).
 * @template TFindAllOptions The query options/filters for fetching multiple records.
 * @template TId The type of the unique identifier (defaults to string).
 * @template TFindAllResult The return structure of the findAll operation (defaults to TEntity[]).
 */
export interface BaseRepository<
  TEntity,
  TCreateInput,
  TRepositoryUpdate = Partial<TEntity>,
  TFindAllOptions = unknown,
  TId = EntityId,
  TFindAllResult = TEntity[],
> {
  /**
   * Retrieves an entity by its unique identifier.
   */
  findById(id: TId): Promise<TEntity | null>

  /**
   * Retrieves a filtered and/or paginated list of entities.
   */
  findAll(options?: TFindAllOptions): Promise<TFindAllResult>

  /**
   * Inserts a new record into the database.
   */
  create(data: TCreateInput): Promise<TEntity>

  /**
   * Updates an existing record in the database by its ID.
   */
  update(id: TId, data: TRepositoryUpdate): Promise<TEntity | null>

  /**
   * Performs a soft delete by marking the record as deleted without purging it.
   */
  softDelete(id: TId): Promise<TEntity | null>
}
