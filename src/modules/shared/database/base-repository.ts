import { PrismaPostgresService } from '../database/prisma-postgres.service';
import { Prisma } from 'prisma/client';

/**
 * A strictly typed Prisma base repository with no `any` usage.
 *
 * @template TDomain - Domain model type
 * @template TDelegate - Prisma model delegate type (e.g., Prisma.UserDelegate)
 * @template TWhereUniqueInput - Prisma unique input type
 * @template TWhereInput - Prisma filtering input type
 * @template TGetOutput - Prisma payload type for fetched objects
 * @template TCreateInput - Prisma create input type
 * @template TUpdateInput - Prisma update input type
 */
export abstract class PrismaBaseRepository<
  TDomain,
  TDelegate extends {
    findUnique(args: any): Promise<TGetOutput | null>;
    findFirst(args: any): Promise<TGetOutput | null>;
    findMany(args: any): Promise<TGetOutput[]>;
    create(args: any): Promise<TGetOutput>;
    update(args: any): Promise<TGetOutput>;
    upsert(args: any): Promise<TGetOutput>;
    delete(args: any): Promise<TGetOutput>;
    count(args: any): Promise<number>;
    createMany(args: any): Promise<{ count: number }>;
    updateMany(args: any): Promise<{ count: number }>;
    deleteMany(args: any): Promise<{ count: number }>;
  },
  TWhereUniqueInput,
  TWhereInput,
  TGetOutput,
  TCreateInput,
  TUpdateInput,
> {
  constructor(protected readonly prisma: PrismaPostgresService) {}

  protected abstract getDelegate(prisma: PrismaPostgresService): TDelegate;
  protected abstract toDomain(prismaModel: TGetOutput | null): TDomain | null;

  /** Find by unique */
  protected async findUnique<TInclude>(
    where: TWhereUniqueInput,
    include?: TInclude,
  ): Promise<TDomain | null> {
    const delegate = this.getDelegate(this.prisma);
    const result = await delegate.findUnique({
      where,
      include,
    });
    return this.toDomain(result);
  }

  /** Find first */
  protected async findFirst<TInclude>(
    where: TWhereInput,
    include?: TInclude,
  ): Promise<TDomain | null> {
    const delegate = this.getDelegate(this.prisma);
    const result = await delegate.findFirst({
      where,
      include,
    });
    return this.toDomain(result);
  }

  /** Find many */
  protected async findMany<TInclude>(
    where?: TWhereInput,
    include?: TInclude,
    options?: {
      take?: number;
      skip?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    },
  ): Promise<TDomain[]> {
    const delegate = this.getDelegate(this.prisma);

    const results = await delegate.findMany({
      where,
      include,
      ...options,
    });

    return results
      .map(r => this.toDomain(r))
      .filter((d): d is TDomain => d !== null);
  }

  /** Create */
  protected async createRecord<TInclude>(
    data: TCreateInput,
    include?: TInclude,
  ): Promise<TDomain> {
    const delegate = this.getDelegate(this.prisma);

    const result = await delegate.create({
      data,
      include,
    });

    const domain = this.toDomain(result);
    if (!domain) throw new Error('Failed to map created record.');
    return domain;
  }

  /** Update */
  protected async updateRecord<TInclude>(
    where: TWhereUniqueInput,
    data: TUpdateInput,
    include?: TInclude,
  ): Promise<TDomain> {
    const delegate = this.getDelegate(this.prisma);

    const result = await delegate.update({
      where,
      data,
      include,
    });

    const domain = this.toDomain(result);
    if (!domain) throw new Error('Failed to map updated record.');
    return domain;
  }

  /** Upsert */
  protected async upsertRecord<TInclude>(
    where: TWhereUniqueInput,
    create: TCreateInput,
    update: TUpdateInput,
    include?: TInclude,
  ): Promise<TDomain> {
    const delegate = this.getDelegate(this.prisma);

    const result = await delegate.upsert({
      where,
      create,
      update,
      include,
    });

    const domain = this.toDomain(result);
    if (!domain) throw new Error('Failed to map upserted record.');
    return domain;
  }

  /** Soft delete */
  protected async softDelete(where: TWhereUniqueInput): Promise<void> {
    const delegate = this.getDelegate(this.prisma);
    await delegate.update({
      where,
      data: { deletedAt: new Date() },
    });
  }

  /** Hard delete */
  protected async hardDelete(where: TWhereUniqueInput): Promise<void> {
    const delegate = this.getDelegate(this.prisma);
    await delegate.delete({ where });
  }

  /** Count */
  protected async count(where?: TWhereInput): Promise<number> {
    const delegate = this.getDelegate(this.prisma);
    return delegate.count({ where });
  }

  /** Exists */
  protected async exists(where: TWhereInput): Promise<boolean> {
    return (await this.count(where)) > 0;
  }

  /** Transaction */
  protected async executeTransaction<R>(
    callback: (tx: Prisma.TransactionClient) => Promise<R>,
  ): Promise<R> {
    return this.prisma.$transaction(callback);
  }

  /** Create many */
  protected async createMany(
    data: TCreateInput[],
    skipDuplicates?: boolean,
  ): Promise<number> {
    const delegate = this.getDelegate(this.prisma);
    const result = await delegate.createMany({
      data,
      skipDuplicates,
    });
    return result.count;
  }

  /** Update many */
  protected async updateMany(
    where: TWhereInput,
    data: TUpdateInput,
  ): Promise<number> {
    const delegate = this.getDelegate(this.prisma);
    const result = await delegate.updateMany({
      where,
      data,
    });
    return result.count;
  }

  /** Delete many */
  protected async deleteMany(where: TWhereInput): Promise<number> {
    const delegate = this.getDelegate(this.prisma);
    const result = await delegate.deleteMany({ where });
    return result.count;
  }

  /** Paginated find */
  protected async findPaginated<TInclude>(
    where: TWhereInput,
    page: number,
    pageSize: number,
    include?: TInclude,
    orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<{
    data: TDomain[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const [data, total] = await Promise.all([
      this.findMany(where, include, {
        skip: page * pageSize,
        take: pageSize,
        orderBy,
      }),
      this.count(where),
    ]);

    return { data, total, page, pageSize };
  }
}
