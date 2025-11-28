import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Earning } from '../../domain/model/earning.model';
import { EARNING_REPOSITORY } from '../../domain/repositories/earning.repository.interface';
import type { IEarningRepository } from '../../domain/repositories/earning.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { UpdateEarningDto } from '../dto/earning.dto';

@Injectable()
export class UpdateEarningUseCase implements IUseCase<{ id: string; dto: UpdateEarningDto }, Earning> {
  constructor(
    @Inject(EARNING_REPOSITORY)
    private readonly earningRepository: IEarningRepository,
  ) {}

  async execute(request: { id: string; dto: UpdateEarningDto }): Promise<Earning> {
    const earning = await this.earningRepository.findById(request.id);
    if (!earning) {
      throw new BusinessException(`Earning not found with id: ${request.id}`);
    }

    // TODO: Add update method to Earning domain model
    // For now, update fields directly (not ideal, but domain model needs update method)
    if (request.dto.description !== undefined) {
      (earning as any).description = request.dto.description;
    }
    if (request.dto.source !== undefined) {
      (earning as any).source = request.dto.source;
    }
    if (request.dto.amount !== undefined) {
      (earning as any).amount = request.dto.amount;
    }
    if (request.dto.earningDate !== undefined) {
      (earning as any).earningDate = request.dto.earningDate;
    }

    const updatedEarning = await this.earningRepository.update(request.id, earning);
    return updatedEarning;
  }
}

