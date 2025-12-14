import { Injectable } from '@nestjs/common';
import { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { Account } from '../../domain/model/account.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { AccountDetailFilterDto } from '../../application/dto/account.dto';
import { AccountInfraMapper } from '../mapper/account-infra.mapper';

export type OnlyAccount = Prisma.AccountGetPayload<{
  include: {
    accountHolder: true;
  }
}>;

export type AccountWithTransactions = Prisma.AccountGetPayload<{
  include: {
    accountHolder: true;
    transactions: true;
  }
}>;

@Injectable()
class AccountRepository implements IAccountRepository {
  constructor(private readonly prisma: PrismaPostgresService) { }

  async findPaged(filter?: BaseFilter<AccountDetailFilterDto>): Promise<PagedResult<Account>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          accountHolder: true,
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 10),
        take: filter?.pageSize ?? 10,
      }),
      this.prisma.account.count({ where }),
    ]);

    return new PagedResult<Account>(
      data.map(m => AccountInfraMapper.toAccountDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 10,
    );
  }

  async findAll(filter?: AccountDetailFilterDto): Promise<Account[]> {
    const accounts = await this.prisma.account.findMany({
      where: this.whereQuery(filter),
      orderBy: { createdAt: 'desc' },
      include: {
        accountHolder: true,
      },
    });

    return accounts.map(m => AccountInfraMapper.toAccountDomain(m)!);
  }

  private whereQuery(props?: AccountDetailFilterDto): Prisma.AccountWhereInput {
    const where: Prisma.AccountWhereInput = {
      ...(props?.type && props.type.length > 0 ? { type: { in: props.type } } : {}),
      ...(props?.status && props.status.length > 0 ? { status: { in: props.status } } : {}),
      ...(props?.accountHolderId ? { accountHolderId: props.accountHolderId } : {}),
      deletedAt: null,
    };
    return where;
  }

  async findById(id: string): Promise<Account | null> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        accountHolder: true,
      },
    });

    return AccountInfraMapper.toAccountDomain(account!);
  }

  async create(account: Account): Promise<Account> {
    const createData: Prisma.AccountUncheckedCreateInput = {
      ...AccountInfraMapper.toAccountCreatePersistence(account),
    };

    const created = await this.prisma.account.create({
      data: createData,
      include: {
        accountHolder: true,
      },
    });

    return AccountInfraMapper.toAccountDomain(created)!;
  }

  async update(id: string, account: Account): Promise<Account> {
    const updateData: Prisma.AccountUncheckedUpdateInput = {
      ...AccountInfraMapper.toAccountUpdatePersistence(account),
    };

    const updated = await this.prisma.account.update({
      where: { id },
      data: updateData,
      include: {
        accountHolder: true,
      },
    });

    return AccountInfraMapper.toAccountDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.account.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export default AccountRepository;
