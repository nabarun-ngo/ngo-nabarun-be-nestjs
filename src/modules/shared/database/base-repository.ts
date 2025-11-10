import { PrismaPostgresService } from '../database/prisma-postgres.service';
import { Prisma } from 'generated/prisma';

/**
 * Type-safe base repository for Prisma models
 * Provides common CRUD operations with full type safety
 * 
 * @template TDomain - Domain model type (e.g., User)
 * @template TPrismaDelegate - Prisma delegate type (e.g., prisma.userProfile)
 * @template TWhereUniqueInput - Prisma unique where input (e.g., Prisma.UserProfileWhereUniqueInput)
 * @template TWhereInput - Prisma where input for filtering
 * @template TInclude - Prisma include type for relations
 * @template TCreateInput - Prisma create input type
 * @template TUpdateInput - Prisma update input type
 */
export abstract class PrismaBaseRepository<
  TDomain,
  TPrismaDelegate,
  TWhereUniqueInput,
  TWhereInput = any,
  //TInclude = any,
  TGetOutput = any,
  TCreateInput = any,
  TUpdateInput = any,
> {
  constructor(private readonly prisma: PrismaPostgresService) {}

  /**
   * Get the Prisma delegate for this repository
   * Must be implemented by concrete repositories
   */
  protected abstract getDelegate(prisma: PrismaPostgresService): TPrismaDelegate;

  /**
   * Map Prisma model to domain model
   * Must be implemented by concrete repositories
   */
  protected abstract toDomain(prismaModel: TGetOutput): TDomain | null;

  /**
   * Find a single record by unique identifier
   */
  protected async findUnique<TInclude = any>(
    where: TWhereUniqueInput,
    include?: TInclude,
  ): Promise<TDomain | null> {
    const delegate = this.getDelegate(this.prisma) as any;
    const result = await delegate.findUnique({
      where,
      include: include ,
    });
    return this.toDomain(result);
  }

  /**
   * Find first record matching criteria
   */
  protected async findFirst<TInclude = any>(
    where: TWhereInput,
    include?: TInclude,
  ): Promise<TDomain | null> {
    const delegate = this.getDelegate(this.prisma) as any;
    const result = await delegate.findFirst({
      where,
      include: include,
    });
    return this.toDomain(result);
  }

  /**
   * Find many records matching criteria
   */
  protected async findMany<TInclude = any>(
    where?: TWhereInput,
    include?: TInclude,
    options?: {
      take?: number;
      skip?: number;
      orderBy?: any;
    },
  ): Promise<TDomain[]> {
    const delegate = this.getDelegate(this.prisma) as any;
    const results = await delegate.findMany({
      where,
      include: include,
      ...options,
    });
    return results
      .map((r: any) => this.toDomain(r))
      .filter((d: TDomain | null): d is TDomain => d !== null);
  }

  /**
   * Create a new record
   */
  protected async createRecord<TInclude = any>(
    data: TCreateInput,
    include?: TInclude,
  ): Promise<TDomain> {
    const delegate = this.getDelegate(this.prisma) as any;
    const result = await delegate.create({
      data,
      include: include,
    });
    const domain = this.toDomain(result);
    if (!domain) {
      throw new Error('Failed to map created record to domain model');
    }
    return domain;
  }

  /**
   * Update an existing record
   */
  protected async updateRecord<TInclude = any>(
    where: TWhereUniqueInput,
    data: TUpdateInput,
    include?: TInclude,
  ): Promise<TDomain> {
    const delegate = this.getDelegate(this.prisma) as any;
    const result = await delegate.update({
      where,
      data,
      include: include,
    });
    const domain = this.toDomain(result);
    if (!domain) {
      throw new Error('Failed to map updated record to domain model');
    }
    return domain;
  }

  /**
   * Upsert a record (update if exists, create otherwise)
   */
  protected async upsertRecord<TInclude = any>(
    where: TWhereUniqueInput,
    create: TCreateInput,
    update: TUpdateInput,
    include?: TInclude,
  ): Promise<TDomain> {
    const delegate = this.getDelegate(this.prisma) as any;
    const result = await delegate.upsert({
      where,
      create,
      update,
      include: include,
    });
    const domain = this.toDomain(result);
    if (!domain) {
      throw new Error('Failed to map upserted record to domain model');
    }
    return domain;
  }

  /**
   * Soft delete a record (sets deletedAt timestamp)
   */
  protected async softDelete(where: TWhereUniqueInput): Promise<void> {
    const delegate = this.getDelegate(this.prisma) as any;
    await delegate.update({
      where,
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Hard delete a record (permanently removes from database)
   */
  protected async hardDelete(where: TWhereUniqueInput): Promise<void> {
    const delegate = this.getDelegate(this.prisma) as any;
    await delegate.delete({ where });
  }

  /**
   * Count records matching criteria
   */
  protected async count(where?: TWhereInput): Promise<number> {
    const delegate = this.getDelegate(this.prisma) as any;
    return delegate.count({ where });
  }

  /**
   * Check if record exists
   */
  protected async exists(where: TWhereInput): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Execute a transaction
   * Provides access to the transaction client
   */
  protected async executeTransaction<R>(
    callback: (tx: Prisma.TransactionClient) => Promise<R>,
  ): Promise<R> {
    return this.prisma.$transaction(callback);
  }

  /**
   * Batch create multiple records
   */
  protected async createMany(
    data: TCreateInput[],
    skipDuplicates?: boolean,
  ): Promise<number> {
    const delegate = this.getDelegate(this.prisma) as any;
    const result = await delegate.createMany({
      data,
      skipDuplicates,
    });
    return result.count;
  }

  /**
   * Batch update multiple records
   */
  protected async updateMany(
    where: TWhereInput,
    data: TUpdateInput,
  ): Promise<number> {
    const delegate = this.getDelegate(this.prisma) as any;
    const result = await delegate.updateMany({
      where,
      data,
    });
    return result.count;
  }

  /**
   * Batch delete multiple records
   */
  protected async deleteMany(where: TWhereInput): Promise<number> {
    const delegate = this.getDelegate(this.prisma) as any;
    const result = await delegate.deleteMany({ where });
    return result.count;
  }

  /**
   * Find records with pagination
   */
  protected async findPaginated<TInclude = any>(
    where: TWhereInput,
    page: number,
    pageSize: number,
    include?: TInclude,
    orderBy?: any,
  ): Promise<{ data: TDomain[]; total: number; page: number; pageSize: number }> {
    const [data, total] = await Promise.all([
      this.findMany(where, include, {
        skip: page * pageSize,
        take: pageSize,
        orderBy,
      }),
      this.count(where),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }
}
