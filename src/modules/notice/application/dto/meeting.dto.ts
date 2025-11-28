import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { MeetingType, MeetingStatus, MeetingRefType } from '../../domain/model/meeting.model';

/**
 * Meeting Detail DTO - matches legacy MeetingDetail
 */
export class MeetingDetailDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  extMeetingId?: string;

  @ApiProperty()
  meetingSummary: string;

  @ApiPropertyOptional()
  meetingDescription?: string;

  @ApiPropertyOptional()
  meetingLocation?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  meetingDate: Date;

  @ApiPropertyOptional()
  meetingStartTime?: string;

  @ApiPropertyOptional()
  meetingEndTime?: string;

  @ApiPropertyOptional()
  meetingRefId?: string;

  @ApiProperty({ enum: MeetingType })
  meetingType: MeetingType;

  @ApiProperty({ enum: MeetingStatus })
  meetingStatus: MeetingStatus;

  @ApiPropertyOptional({ type: [String] })
  meetingAttendees?: string[]; // UserDetail references

  @ApiPropertyOptional()
  meetingRemarks?: string;

  @ApiPropertyOptional({ enum: MeetingRefType })
  meetingRefType?: MeetingRefType;

  @ApiPropertyOptional()
  extAudioConferenceLink?: string;

  @ApiPropertyOptional()
  extVideoConferenceLink?: string;

  @ApiPropertyOptional()
  extHtmlLink?: string;

  @ApiPropertyOptional()
  creatorEmail?: string;

  @ApiPropertyOptional()
  extConferenceStatus?: string;
}

/**
 * Create Meeting DTO
 */
export class CreateMeetingDto {
  @ApiPropertyOptional({ type: [String], description: 'User IDs of attendees (will be converted to emails)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendeeUserIds?: string[];
  @ApiProperty()
  @IsString()
  meetingSummary: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingLocation?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDate()
  @Type(() => Date)
  meetingDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingStartTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingEndTime?: string;

  @ApiProperty({ enum: MeetingType })
  @IsEnum(MeetingType)
  meetingType: MeetingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingRefId?: string;

  @ApiPropertyOptional({ enum: MeetingRefType })
  @IsOptional()
  @IsEnum(MeetingRefType)
  meetingRefType?: MeetingRefType;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendeeIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingRemarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  creatorEmail?: string;
}

/**
 * Update Meeting DTO
 */
export class UpdateMeetingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingLocation?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  meetingDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingStartTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingEndTime?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendeeIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingRemarks?: string;
}

