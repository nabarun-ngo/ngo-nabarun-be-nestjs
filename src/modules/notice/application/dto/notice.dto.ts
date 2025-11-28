import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { NoticeStatus } from '../../domain/model/notice.model';
import { MeetingDetailDto } from './meeting.dto';

/**
 * Notice Detail DTO - matches legacy NoticeDetail
 */
export class NoticeDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  creator?: string; // UserDetail reference

  @ApiPropertyOptional()
  creatorRoleCode?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  noticeDate: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  publishDate?: Date;

  @ApiProperty({ enum: NoticeStatus })
  noticeStatus: NoticeStatus;

  @ApiPropertyOptional()
  hasMeeting?: boolean;

  @ApiPropertyOptional({ type: MeetingDetailDto })
  meeting?: MeetingDetailDto;
}

/**
 * Notice Detail Filter DTO
 */
export class NoticeDetailFilterDto {
  @ApiPropertyOptional({ enum: NoticeStatus, isArray: true })
  @IsOptional()
  status?: NoticeStatus[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

/**
 * Create Notice DTO
 */
export class CreateNoticeDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  creatorRoleCode?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  noticeDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasMeeting?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingId?: string;
}

/**
 * Update Notice DTO
 */
export class UpdateNoticeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  noticeDate?: Date;
}

