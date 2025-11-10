import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { Donation } from '../../domain/model/donation.model';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { CreateOneTimeDonationDto, DonationDto } from '../dto/donation.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessException } from 'src/shared/exceptions/business-exception';

@Injectable()
export class CreateOneTimeDonationUseCase implements IUseCase<CreateOneTimeDonationDto, DonationDto> {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateOneTimeDonationDto): Promise<DonationDto> {
    // Validate guest donation requirements
    if (!request.donorId && (!request.donorName || !request.donorEmail)) {
      throw new BusinessException('Guest donations require donor name and email');
    }

    // Create one-time donation
    const donation = Donation.createOneTime({
      amount: request.amount,
      currency: request.currency,
      donorId: request.donorId,
      donorName: request.donorName,
      donorEmail: request.donorEmail,
      description: request.description,
    });

    // Save to repository
    const savedDonation = await this.donationRepository.create(donation);

    // Emit domain events
    for (const event of donation.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    donation.clearEvents();

    return this.toDonationDto(savedDonation);
  }

  private toDonationDto(donation: Donation): DonationDto {
    return {
      id: donation.id,
      type: donation.type,
      amount: donation.amount,
      currency: donation.currency,
      status: donation.status,
      donorId: donation.donorId,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      description: donation.description,
      raisedDate: donation.raisedDate,
      paidDate: donation.paidDate,
      transactionId: donation.transactionId,
      createdAt: donation.createdAt,
    };
  }
}
