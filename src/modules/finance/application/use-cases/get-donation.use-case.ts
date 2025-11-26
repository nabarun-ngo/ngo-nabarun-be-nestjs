import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Donation } from '../../domain/model/donation.model';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

@Injectable()
export class GetDonationUseCase implements IUseCase<string, Donation> {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
  ) {}

  async execute(id: string): Promise<Donation> {
    const donation = await this.donationRepository.findById(id);
    if (!donation) {
      throw new BusinessException(`Donation not found with id: ${id}`);
    }
    return donation;
  }
}


