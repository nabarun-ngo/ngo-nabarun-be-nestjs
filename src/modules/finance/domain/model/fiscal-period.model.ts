import { AggregateRoot } from 'src/shared/models/aggregate-root';
import { BusinessException } from 'src/shared/exceptions/business-exception';

export enum FiscalPeriodStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface FiscalPeriodFilter {
  status?: FiscalPeriodStatus[];
  code?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
}

export interface CreateFiscalPeriodProps {
  id: string;
  code: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

/**
 * FiscalPeriod Domain Model (Aggregate Root)
 * Represents a period (e.g. month/quarter) for closing the books. When CLOSED, no new journal entries allowed for that period.
 */
export class FiscalPeriod extends AggregateRoot<string> {
  #code: string;
  #name: string;
  #startDate: Date;
  #endDate: Date;
  #status: FiscalPeriodStatus;
  #closedAt: Date | undefined;
  #closedById: string | undefined;

  constructor(
    id: string,
    code: string,
    name: string,
    startDate: Date,
    endDate: Date,
    status: FiscalPeriodStatus,
    closedAt?: Date,
    closedById?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#code = code;
    this.#name = name;
    this.#startDate = startDate;
    this.#endDate = endDate;
    this.#status = status;
    this.#closedAt = closedAt;
    this.#closedById = closedById;
  }

  static create(props: CreateFiscalPeriodProps): FiscalPeriod {
    if (!props.code?.trim()) {
      throw new BusinessException('Period code is required');
    }
    if (!props.name?.trim()) {
      throw new BusinessException('Period name is required');
    }
    if (!props.startDate || !props.endDate) {
      throw new BusinessException('Start date and end date are required');
    }
    if (props.startDate > props.endDate) {
      throw new BusinessException('Start date must be before or equal to end date');
    }
    return new FiscalPeriod(
      props.id,
      props.code,
      props.name,
      props.startDate,
      props.endDate,
      FiscalPeriodStatus.OPEN,
      undefined,
      undefined,
      new Date(),
      new Date(),
    );
  }

  close(closedById: string): void {
    if (this.#status === FiscalPeriodStatus.CLOSED) {
      throw new BusinessException('Period is already closed');
    }
    this.#status = FiscalPeriodStatus.CLOSED;
    this.#closedAt = new Date();
    this.#closedById = closedById;
  }

  containsDate(date: Date): boolean {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const start = new Date(this.#startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(this.#endDate);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  }

  get code(): string {
    return this.#code;
  }
  get name(): string {
    return this.#name;
  }
  get startDate(): Date {
    return this.#startDate;
  }
  get endDate(): Date {
    return this.#endDate;
  }
  get status(): FiscalPeriodStatus {
    return this.#status;
  }
  get closedAt(): Date | undefined {
    return this.#closedAt;
  }
  get closedById(): string | undefined {
    return this.#closedById;
  }

  isOpen(): boolean {
    return this.#status === FiscalPeriodStatus.OPEN;
  }

  isClosed(): boolean {
    return this.#status === FiscalPeriodStatus.CLOSED;
  }
}
