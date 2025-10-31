import { ValueObject } from './value-object';

export class BaseFilter<T> extends ValueObject<T> {
  constructor(
    props: T,
    readonly pageIndex?: number,
    readonly pageSize?: number
  ) {
    super(props);
  }
}
