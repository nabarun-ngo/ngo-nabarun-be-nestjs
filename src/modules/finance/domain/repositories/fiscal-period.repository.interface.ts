import { BaseRepository } from 'src/shared/models/repository.base';
import { FiscalPeriod, FiscalPeriodFilter } from '../model/fiscal-period.model';

export interface IFiscalPeriodRepository extends BaseRepository<FiscalPeriod, string, FiscalPeriodFilter> {
  findByCode(code: string): Promise<FiscalPeriod | null>;

  findOpenPeriodForDate(date: Date): Promise<FiscalPeriod | null>;
}

export const FISCAL_PERIOD_REPOSITORY = Symbol('FISCAL_PERIOD_REPOSITORY');
