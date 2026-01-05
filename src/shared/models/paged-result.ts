import { ApiProperty } from '@nestjs/swagger';

export class PagedResult<T> {

  constructor(content: T[], totalSize: number, pageIndex: number, pageSize: number) {
    this.content = content;
    this.totalSize = totalSize;
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
  }

  @ApiProperty({
    description: 'List of items for the current page',
    isArray: true,
    type: Object
  })
  content: T[];

  @ApiProperty({ description: 'Current page index (1-based or 0-based depending on API)' })
  pageIndex: number;

  @ApiProperty({ description: 'Page size (number of items per page)' })
  pageSize: number;

  @ApiProperty({ description: 'Total number of items across all pages' })
  totalSize: number;
}
