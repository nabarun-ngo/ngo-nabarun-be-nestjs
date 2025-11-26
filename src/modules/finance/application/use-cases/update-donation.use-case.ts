import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Donation } from '../../domain/model/donation.model';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { DonationDto } from '../dto/donation.dto';

@Injectable()
export class UpdateDonationUseCase implements IUseCase<{ id: string; dto: Partial<DonationDto> }, Donation> {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
  ) {}

  async execute(request: { id: string; dto: Partial<DonationDto> }): Promise<Donation> {
    const donation = await this.donationRepository.findById(request.id);
    if (!donation) {
      throw new BusinessException(`Donation not found with id: ${request.id}`);
    }

    // Update donation using domain methods
    const updateProps: any = {};
    if (request.dto.amount !== undefined) updateProps.amount = request.dto.amount;
    if (request.dto.description !== undefined) updateProps.description = request.dto.description;
    if (request.dto.remarks !== undefined) updateProps.remarks = request.dto.remarks;
    if (request.dto.startDate !== undefined) updateProps.startDate = request.dto.startDate;
    if (request.dto.endDate !== undefined) updateProps.endDate = request.dto.endDate;
    if (request.dto.forEvent !== undefined) updateProps.forEventId = request.dto.forEvent;
    if (request.dto.additionalFields !== undefined) {
      updateProps.additionalFields = request.dto.additionalFields.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {} as Record<string, any>);
    }
    donation.update(updateProps);

    // Update status if provided
    if (request.dto.status) {
      if (request.dto.status === donation.status) {
        // No change needed
      } else {
        // Handle status transitions through domain methods
        switch (request.dto.status) {
          case 'CANCELLED':
            donation.cancel(request.dto.cancelletionReason);
            break;
          case 'PAYMENT_FAILED':
            donation.markAsFailed(request.dto.paymentFailureDetail);
            break;
          case 'PAY_LATER':
            donation.markAsPayLater(request.dto.laterPaymentReason || '');
            break;
          case 'UPDATE_MISTAKE':
            donation.markForUpdateMistake();
            break;
          case 'PENDING':
            donation.markAsPending();
            break;
          default:
            // Other statuses handled by specific methods
            break;
        }
      }
    }

    const updatedDonation = await this.donationRepository.update(request.id, donation);
    return updatedDonation;
  }
}


