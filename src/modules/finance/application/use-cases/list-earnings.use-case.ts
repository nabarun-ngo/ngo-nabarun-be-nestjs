import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Earning } from '../../domain/model/earning.model';
import { EARNING_REPOSITORY } from '../../domain/repositories/earning.repository.interface';
import type { IEarningRepository } from '../../domain/repositories/earning.repository.interface';
import { BaseFilter } from '../../../../shared/models/base-filter-props';
import { PagedResult } from '../../../../shared/models/paged-result';
import { EarningDetailFilterDto } from '../dto/earning.dto';

@Injectable()
export class ListEarningsUseCase implements IUseCase<BaseFilter<EarningDetailFilterDto>, PagedResult<Earning>> {
  constructor(
    @Inject(EARNING_REPOSITORY)
    private readonly earningRepository: IEarningRepository,
  ) {}

  async execute(request: BaseFilter<EarningDetailFilterDto>): Promise<PagedResult<Earning>> {
    // TODO: Implement paged filtering in repository
    const allEarnings = await this.earningRepository.findAll();
    
    let filtered = allEarnings;
    
    if (request.props?.status && request.props.status.length > 0) {
      filtered = filtered.filter(e => request.props?.status?.includes(e.status));
    }
    if (request.props?.category && request.props.category.length > 0) {
      filtered = filtered.filter(e => request.props?.category?.includes(e.category));
    }
    if (request.props?.source) {
      filtered = filtered.filter(e => e.source === request.props?.source);
    }
    if (request.props?.referenceId) {
      filtered = filtered.filter(e => e.referenceId === request.props?.referenceId);
    }
    
    const page = request.pageIndex || 0;
    const size = request.pageSize || 10;
    const start = page * size;
    const end = start + size;
    const items = filtered.slice(start, end);
    
    return new PagedResult(items, filtered.length, page, size);
  }
}

