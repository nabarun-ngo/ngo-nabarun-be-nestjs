import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Account } from '../../domain/model/account.model';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { BaseFilter } from '../../../../shared/models/base-filter-props';
import { PagedResult } from '../../../../shared/models/paged-result';
import { AccountDetailFilterDto } from '../dto/account.dto';

@Injectable()
export class ListAccountsUseCase implements IUseCase<BaseFilter<AccountDetailFilterDto>, PagedResult<Account>> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(request: BaseFilter<AccountDetailFilterDto>): Promise<PagedResult<Account>> {
    // TODO: Implement paged filtering in repository
    const allAccounts = await this.accountRepository.findAll();
    
    let filtered = allAccounts;
    
    if (request.props?.status && request.props.status.length > 0) {
      filtered = filtered.filter(a => request.props?.status?.includes(a.status));
    }
    if (request.props?.type && request.props.type.length > 0) {
      filtered = filtered.filter(a => request.props?.type?.includes(a.type));
    }
    if (request.props?.accountHolderId) {
      filtered = filtered.filter(a => a.accountHolderId === request.props?.accountHolderId);
    }
    
    const page = request.pageIndex || 0;
    const size = request.pageSize || 10;
    const start = page * size;
    const end = start + size;
    const items = filtered.slice(start, end);
    
    return new PagedResult(items, filtered.length, page, size);
  }
}


