import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Account } from '../../domain/model/account.model';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

@Injectable()
export class GetAccountUseCase implements IUseCase<string, Account> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(id: string): Promise<Account> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new BusinessException(`Account not found with id: ${id}`);
    }
    return account;
  }
}


