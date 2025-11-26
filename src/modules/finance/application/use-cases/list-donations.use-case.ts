import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Donation } from '../../domain/model/donation.model';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { BaseFilter } from '../../../../shared/models/base-filter-props';
import { PagedResult } from '../../../../shared/models/paged-result';

export interface DonationFilter {
  donorId?: string;
  status?: string[];
  type?: string[];
  isGuest?: boolean;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class ListDonationsUseCase implements IUseCase<BaseFilter<DonationFilter>, PagedResult<Donation>> {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
  ) {}

  async execute(request: BaseFilter<DonationFilter>): Promise<PagedResult<Donation>> {
    // TODO: Implement paged filtering in repository
    // For now, get all and filter in memory (not ideal for production)
    const allDonations = await this.donationRepository.findAll();
    
    let filtered = allDonations;
    
    if (request.props?.donorId) {
      filtered = filtered.filter(d => d.donorId === request.props?.donorId);
    }
    if (request.props?.status && request.props.status.length > 0) {
      filtered = filtered.filter(d => request.props?.status?.includes(d.status));
    }
    if (request.props?.type && request.props.type.length > 0) {
      filtered = filtered.filter(d => request.props?.type?.includes(d.type));
    }
    if (request.props?.isGuest !== undefined) {
      filtered = filtered.filter(d => d.isGuestDonation() === request.props?.isGuest);
    }
    
    // Apply pagination
    const page = request.pageIndex || 0;
    const size = request.pageSize || 10;
    const start = page * size;
    const end = start + size;
    const items = filtered.slice(start, end);
    
    return new PagedResult(items, filtered.length, page, size);
  }
}


