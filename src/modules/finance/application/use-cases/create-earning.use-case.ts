import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Earning } from '../../domain/model/earning.model';
import { EARNING_REPOSITORY } from '../../domain/repositories/earning.repository.interface';
import type { IEarningRepository } from '../../domain/repositories/earning.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateEarningDto } from '../dto/earning.dto';

@Injectable()
export class CreateEarningUseCase implements IUseCase<CreateEarningDto, Earning> {
  constructor(
    @Inject(EARNING_REPOSITORY)
    private readonly earningRepository: IEarningRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateEarningDto): Promise<Earning> {
    const earning = Earning.create({
      category: request.category as any,
      amount: request.amount,
      currency: request.currency,
      description: request.description,
      source: request.source,
      referenceId: request.referenceId,
      referenceType: request.referenceType,
      earningDate: request.earningDate,
    });

    const savedEarning = await this.earningRepository.create(earning);

    // Emit domain events
    for (const event of savedEarning.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    savedEarning.clearEvents();

    return savedEarning;
  }
}

