import { ApiProperty } from '@nestjs/swagger';

export class PagedResult<T> {
  @ApiProperty({ description: 'List of items for the current page', isArray: true })
  items: T[];

  @ApiProperty({ description: 'Total number of items across all pages' })
  total: number;

  @ApiProperty({ description: 'Current page index (1-based or 0-based depending on API)' })
  page: number;

  @ApiProperty({ description: 'Page size (number of items per page)' })
  size: number;

  constructor(items: T[], total: number, page: number, size: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.size = size;
  }
}
