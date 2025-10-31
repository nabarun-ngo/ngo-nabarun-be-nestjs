export class PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;

  constructor(items: T[], total: number, page: number, size: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.size = size;
  }
}
