import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Earning, EarningCategory } from '../../domain/model/earning.model';
import { EARNING_REPOSITORY } from '../../domain/repositories/earning.repository.interface';
import type { IEarningRepository } from '../../domain/repositories/earning.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostToLedgerUseCase } from './post-to-ledger.use-case';
import { JournalEntryReferenceType } from '../../domain/model/journal-entry.model';

export class CreateEarning {
  accountId: string;
  category: EarningCategory;
  amount: number;
  currency: string;
  description: string;
  referenceId?: string;
  referenceType?: string;
  earningDate?: Date;
  postedById: string;
}

@Injectable()
export class CreateEarningUseCase implements IUseCase<CreateEarning, Earning> {
  constructor(
    @Inject(EARNING_REPOSITORY)
    private readonly earningRepository: IEarningRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly postToLedgerUseCase: PostToLedgerUseCase,
  ) {}

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

    const journalEntry = await this.postToLedgerUseCase.execute({
      entryDate: request.earningDate ?? new Date(),
      description: request.description,
      referenceType: JournalEntryReferenceType.EARNING,
      referenceId: savedEarning.id,
      postedById: request.postedById,
      lines: [
        {
          accountId: request.accountId,
          debitAmount: 0,
          creditAmount: request.amount,
          currency: request.currency,
          particulars: `Earning - ${request.category}`,
        },
      ],
    });

    savedEarning.markAsReceived(request.accountId, journalEntry.id);
    const updated = await this.earningRepository.update(savedEarning.id, savedEarning);

    for (const event of updated.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    updated.clearEvents();

    return updated;
  }
}

