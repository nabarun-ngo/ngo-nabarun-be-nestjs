export class BaseFilter<T> {
  readonly pageIndex?: number;
  readonly pageSize?: number;
  readonly props?: T

  constructor(props?: T, pageIndex?: number, pageSize?: number) {
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    this.props = props;
  }


}