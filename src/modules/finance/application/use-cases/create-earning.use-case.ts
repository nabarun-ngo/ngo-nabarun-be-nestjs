import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Earning, EarningCategory } from '../../domain/model/earning.model';
import { EARNING_REPOSITORY } from '../../domain/repositories/earning.repository.interface';
import type { IEarningRepository } from '../../domain/repositories/earning.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import { TransactionRefType, TransactionType } from '../../domain/model/transaction.model';

export class CreateEarning {
  accountId: string;
  category: EarningCategory;
  amount: number;
  currency: string;
  description: string;
  referenceId?: string;
  referenceType?: string;
  earningDate?: Date;
}


@Injectable()
export class CreateEarningUseCase implements IUseCase<CreateEarning, Earning> {
  constructor(
    @Inject(EARNING_REPOSITORY)
    private readonly earningRepository: IEarningRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly createTransactionUseCase: CreateTransactionUseCase,
  ) { }

  async execute(request: CreateEarning): Promise<Earning> {
    const earning = Earning.create({
      category: request.category,
      amount: request.amount,
      currency: request.currency,
      description: request.description,
      referenceId: request.referenceId,
      referenceType: request.referenceType,
      earningDate: request.earningDate,
    });



    const savedEarning = await this.earningRepository.create(earning);

    await this.createTransactionUseCase.execute({
      txnAmount: request.amount,
      currency: request.currency,
      txnDescription: request.description,
      txnParticulars: `Earning - ${request.category}`,
      txnRefId: request.referenceId,
      txnRefType: TransactionRefType.EARNING,
      accountId: request.accountId,
      txnDate: request.earningDate,
      txnType: TransactionType.IN,
    });

    // Emit domain events
    for (const event of savedEarning.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    savedEarning.clearEvents();

    return savedEarning;
  }
}

