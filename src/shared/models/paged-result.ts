import { ApiProperty } from '@nestjs/swagger';

export class PagedResult<T> {
  @ApiProperty({
    description: 'List of items for the current page',
    isArray: true,
    type: Object
  })
  items: T[];

  @ApiProperty({ description: 'Total number of items across all pages' })
  total: number;

  @ApiProperty({ description: 'Current page index (1-based or 0-based depending on API)' })
  pageIndex: number;

  @ApiProperty({ description: 'Page size (number of items per page)' })
  pageSize: number;

  constructor(items: T[], total: number, pageIndex: number, pageSize: number) {
    this.items = items;
    this.total = total;
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
  }
}
