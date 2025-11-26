import { Inject, Injectable } from '@nestjs/common';
import { EARNING_REPOSITORY } from '../../domain/repositories/earning.repository.interface';
import type { IEarningRepository } from '../../domain/repositories/earning.repository.interface';
import { EarningDetailDto, EarningDetailFilterDto, CreateEarningDto, UpdateEarningDto } from '../dto/earning.dto';
import { EarningDtoMapper } from '../dto/finance-dto.mapper';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateEarningUseCase } from '../use-cases/create-earning.use-case';
import { UpdateEarningUseCase } from '../use-cases/update-earning.use-case';
import { ListEarningsUseCase } from '../use-cases/list-earnings.use-case';
import { GetEarningUseCase } from '../use-cases/get-earning.use-case';

@Injectable()
export class EarningService {
  constructor(
    @Inject(EARNING_REPOSITORY)
    private readonly earningRepository: IEarningRepository,
    private readonly createEarningUseCase: CreateEarningUseCase,
    private readonly updateEarningUseCase: UpdateEarningUseCase,
    private readonly listEarningsUseCase: ListEarningsUseCase,
    private readonly getEarningUseCase: GetEarningUseCase,
  ) {}

  async list(filter: BaseFilter<EarningDetailFilterDto>): Promise<PagedResult<EarningDetailDto>> {
    const result = await this.listEarningsUseCase.execute(filter);
    return new PagedResult(
      result.items.map(e => EarningDtoMapper.toDto(e)),
      result.total,
      result.page,
      result.size,
    );
  }

  async getById(id: string): Promise<EarningDetailDto> {
    const earning = await this.getEarningUseCase.execute(id);
    return EarningDtoMapper.toDto(earning);
  }

  async create(dto: CreateEarningDto): Promise<EarningDetailDto> {
    const earning = await this.createEarningUseCase.execute(dto);
    return EarningDtoMapper.toDto(earning);
  }

  async update(id: string, dto: UpdateEarningDto): Promise<EarningDetailDto> {
    const earning = await this.updateEarningUseCase.execute({ id, dto });
    return EarningDtoMapper.toDto(earning);
  }
}

