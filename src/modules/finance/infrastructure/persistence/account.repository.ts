import { Injectable } from '@nestjs/common';
import { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { Account, AccountType } from '../../domain/model/account.model';
import { Prisma } from 'prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { PrismaBaseRepository } from 'src/modules/shared/database/base-repository';
import { FinanceInfraMapper } from '../finance-infra.mapper';
import { AccountPersistence } from '../types/finance-persistence.types';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';

@Injectable()
class AccountRepository
  extends PrismaBaseRepository<
    Account,
    PrismaPostgresService['account'],
    Prisma.AccountWhereUniqueInput,
    Prisma.AccountWhereInput,
    AccountPersistence.Base,
    Prisma.AccountCreateInput,
    Prisma.AccountUpdateInput
  >
  implements IAccountRepository
{
  protected getDelegate(prisma: PrismaPostgresService) {
    return prisma.account;
  }
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }
  findPaged(filter?: BaseFilter<any> | undefined): Promise<PagedResult<Account>> {
    throw new Error('Method not implemented.');
  }

  

  protected toDomain(prismaModel: any): Account | null {
    return FinanceInfraMapper.toAccountDomain(prismaModel);
  }

  async findAll(filter?: any): Promise<Account[]> {
    const where: Prisma.AccountWhereInput = {
      type: filter?.type,
      status: filter?.status,
      deletedAt: null,
    };
    return this.findMany(where);
  }

  async findById(id: string): Promise<Account | null> {
    return this.findUnique({ id });
  }

  async findByType(type: AccountType): Promise<Account[]> {
    return this.findMany({ type, deletedAt: null });
  }

  async findMainAccount(): Promise<Account | null> {
    return this.findFirst({ type: AccountType.MAIN, deletedAt: null });
  }

  async create(account: Account): Promise<Account> {
    const createData = FinanceInfraMapper.toAccountCreatePersistence(account);
    return this.createRecord(createData);
  }

  async update(id: string, account: Account): Promise<Account> {
    const updateData = FinanceInfraMapper.toAccountUpdatePersistence(account);
    return this.updateRecord({ id }, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.softDelete({ id });
  }
}

export default AccountRepository;
