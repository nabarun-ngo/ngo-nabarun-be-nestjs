import { Inject, Injectable } from '@nestjs/common';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { DonationDto, DonationDetailFilterDto } from '../dto/donation.dto';
import { DonationDtoMapper } from '../dto/finance-dto.mapper';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateDonationUseCase } from '../use-cases/create-donation.use-case';
import { UpdateDonationUseCase } from '../use-cases/update-donation.use-case';
import { ProcessDonationPaymentUseCase } from '../use-cases/process-donation-payment.use-case';
import { ListDonationsUseCase } from '../use-cases/list-donations.use-case';
import { GetDonationUseCase } from '../use-cases/get-donation.use-case';

@Injectable()
export class DonationService {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
    private readonly createDonationUseCase: CreateDonationUseCase,
    private readonly updateDonationUseCase: UpdateDonationUseCase,
    private readonly processPaymentUseCase: ProcessDonationPaymentUseCase,
    private readonly listDonationsUseCase: ListDonationsUseCase,
    private readonly getDonationUseCase: GetDonationUseCase,
  ) {}

  async list(filter: BaseFilter<DonationDetailFilterDto>): Promise<PagedResult<DonationDto>> {
    const result = await this.listDonationsUseCase.execute(filter);
    return new PagedResult(
      result.items.map(d => DonationDtoMapper.toDto(d)),
      result.total,
      result.page,
      result.size,
    );
  }

  async getById(id: string): Promise<DonationDto> {
    const donation = await this.getDonationUseCase.execute(id);
    return DonationDtoMapper.toDto(donation);
  }

  async create(dto: DonationDto): Promise<DonationDto> {
    const donation = await this.createDonationUseCase.execute(dto);
    return DonationDtoMapper.toDto(donation);
  }

  async update(id: string, dto: Partial<DonationDto>): Promise<DonationDto> {
    const donation = await this.updateDonationUseCase.execute({ id, dto });
    return DonationDtoMapper.toDto(donation);
  }

  async processPayment(id: string, dto: any): Promise<DonationDto> {
    const donation = await this.processPaymentUseCase.execute({
      donationId: id,
      ...dto,
    });
    return DonationDtoMapper.toDto(donation);
  }
}


