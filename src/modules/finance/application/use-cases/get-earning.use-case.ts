import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Earning } from '../../domain/model/earning.model';
import { EARNING_REPOSITORY } from '../../domain/repositories/earning.repository.interface';
import type { IEarningRepository } from '../../domain/repositories/earning.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

@Injectable()
export class GetEarningUseCase implements IUseCase<string, Earning> {
  constructor(
    @Inject(EARNING_REPOSITORY)
    private readonly earningRepository: IEarningRepository,
  ) {}

  async execute(id: string): Promise<Earning> {
    const earning = await this.earningRepository.findById(id);
    if (!earning) {
      throw new BusinessException(`Earning not found with id: ${id}`);
    }
    return earning;
  }
}

