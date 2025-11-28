import { Inject, Injectable } from '@nestjs/common';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { DonationDto, DonationDetailFilterDto, CreateDonationDto, UpdateDonationDto } from '../dto/donation.dto';
import { DonationDtoMapper } from '../dto/mapper/donation-dto.mapper';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateDonationUseCase } from '../use-cases/create-donation.use-case';
import { UpdateDonationUseCase } from '../use-cases/update-donation.use-case';
import { ProcessDonationPaymentUseCase } from '../use-cases/process-donation-payment.use-case';
import { DonationType } from '../../domain/model/donation.model';
import { BusinessException } from 'src/shared/exceptions/business-exception';

@Injectable()
export class DonationService {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
    private readonly createDonationUseCase: CreateDonationUseCase,
    private readonly updateDonationUseCase: UpdateDonationUseCase,
    private readonly processPaymentUseCase: ProcessDonationPaymentUseCase,
  ) { }

  async list(filter: BaseFilter<DonationDetailFilterDto>): Promise<PagedResult<DonationDto>> {
    const result = await this.donationRepository.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: {
        donorId: filter.props?.donorId,
        status: filter.props?.status,
        type: filter.props?.type,
        isGuest: filter.props?.isGuest,
        startDate: filter.props?.startDate,
        endDate: filter.props?.endDate,
      }
    });
    return new PagedResult(
      result.items.map(d => DonationDtoMapper.toDto(d)),
      result.total,
      result.pageIndex,
      result.pageSize,
    );
  }

  async getById(id: string): Promise<DonationDto> {
    const donation = await this.donationRepository.findById(id);
    if (!donation) {
      throw new BusinessException(`Donation not found with id: ${id}`);
    }
    return DonationDtoMapper.toDto(donation);
  }

  async create(dto: CreateDonationDto): Promise<DonationDto> {
    const donation = await this.createDonationUseCase.execute({
      type: dto.type,
      amount: dto.amount,
      isGuest: false,
      endDate: dto.endDate,
      startDate: dto.startDate,
      donorId: dto.donorId,
      forEventId: dto.type == DonationType.ONETIME ? dto.forEventId : undefined,
    });
    return DonationDtoMapper.toDto(donation);
  }

  async update(id: string, dto: UpdateDonationDto, userId: string): Promise<DonationDto> {
    const donation = await this.updateDonationUseCase.execute({
      status: dto.status,
      remarks: dto.remarks,
      amount: dto.amount,
      forEvent: dto.forEvent,
      id: id,
      paidToAccountId: dto.paidToAccountId,
      confirmedById: userId,
      paidUsingUPI: dto.paidUsingUPI,
      paymentMethod: dto.paymentMethod,
      paidOn: dto.paidOn,
    });
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


