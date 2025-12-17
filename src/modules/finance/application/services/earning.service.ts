import { Inject, Injectable } from '@nestjs/common';
import { EARNING_REPOSITORY } from '../../domain/repositories/earning.repository.interface';
import type { IEarningRepository } from '../../domain/repositories/earning.repository.interface';
import { EarningDetailDto, EarningDetailFilterDto, CreateEarningDto, UpdateEarningDto } from '../dto/earning.dto';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateEarningUseCase } from '../use-cases/create-earning.use-case';
import { UpdateEarningUseCase } from '../use-cases/update-earning.use-case';
import { EarningDtoMapper } from '../dto/mapper/earning-dto.mapper';
import { BusinessException } from 'src/shared/exceptions/business-exception';

@Injectable()
export class EarningService {
  constructor(
    @Inject(EARNING_REPOSITORY)
    private readonly earningRepository: IEarningRepository,
    private readonly createEarningUseCase: CreateEarningUseCase,
    private readonly updateEarningUseCase: UpdateEarningUseCase,
  ) { }

  async list(filter: BaseFilter<EarningDetailFilterDto>): Promise<PagedResult<EarningDetailDto>> {
    const result = await this.earningRepository.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: filter.props,
    });
    return new PagedResult(
      result.content.map(e => EarningDtoMapper.toDto(e)),
      result.totalSize,
      result.pageIndex,
      result.pageSize,
    );
  }

  async getById(id: string): Promise<EarningDetailDto> {
    const earning = await this.earningRepository.findById(id);
    if (!earning) {
      throw new BusinessException('Earning not found with id: ' + id);
    }
    return EarningDtoMapper.toDto(earning);
  }

  async create(dto: CreateEarningDto): Promise<EarningDetailDto> {
    const earning = await this.createEarningUseCase.execute({
      accountId: dto.accountId,
      category: dto.category,
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
      earningDate: dto.earningDate,
    });
    return EarningDtoMapper.toDto(earning);
  }

  async update(id: string, dto: UpdateEarningDto): Promise<EarningDetailDto> {
    const earning = await this.updateEarningUseCase.execute({ id, dto });
    return EarningDtoMapper.toDto(earning);
  }
}

