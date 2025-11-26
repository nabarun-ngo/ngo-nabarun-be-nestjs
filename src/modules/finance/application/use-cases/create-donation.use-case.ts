import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Donation, DonationType } from '../../domain/model/donation.model';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DonationDto } from '../dto/donation.dto';

@Injectable()
export class CreateDonationUseCase implements IUseCase<DonationDto, Donation> {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: DonationDto): Promise<Donation> {
    let donation: Donation;

    if (request.type === DonationType.REGULAR) {
      donation = Donation.createRegular({
        amount: request.amount,
        currency: request.currency,
        donorId: request.donorId!,
        description: request.description,
        raisedDate: request.raisedOn,
        startDate: request.startDate,
        endDate: request.endDate,
      });
    } else {
      donation = Donation.createOneTime({
        amount: request.amount,
        currency: request.currency,
        donorId: request.donorId,
        donorName: request.donorName,
        donorEmail: request.donorEmail,
        description: request.description,
      });
    }

    // Apply additional fields from DTO
    if (request.forEventId) {
      donation.update({ forEventId: request.forEventId });
    }
    if (request.additionalFields) {
      donation.update({ additionalFields: request.additionalFields });
    }
    if (request.remarks) {
      donation.update({ remarks: request.remarks });
    }

    // Save to repository
    const savedDonation = await this.donationRepository.create(donation);

    // Emit domain events
    for (const event of savedDonation.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    savedDonation.clearEvents();

    return savedDonation;
  }
}


