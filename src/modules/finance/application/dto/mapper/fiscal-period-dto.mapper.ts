import { FiscalPeriodResponseDto } from '../fiscal-period.dto';
import { FiscalPeriod } from '../../../domain/model/fiscal-period.model';

export class FiscalPeriodDtoMapper {
  static toResponseDto(period: FiscalPeriod): FiscalPeriodResponseDto {
    return {
      id: period.id,
      code: period.code,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
      closedAt: period.closedAt,
      closedById: period.closedById,
      createdAt: period.createdAt,
      updatedAt: period.updatedAt,
    };
  }
}
