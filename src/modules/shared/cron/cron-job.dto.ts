import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsString } from "class-validator";

export class CronJobDto {
    @ApiProperty()
    @IsString()
    name: string;
    @ApiProperty()
    @IsString()
    description: string;
    @ApiProperty()
    @IsString()
    handler: string; // method name in service
    @ApiProperty()
    @IsBoolean()
    enabled: boolean;
    @ApiProperty()
    @Type(() => Date)
    nextRun: Date;
}

export class SchedulerLogDto {
    @ApiProperty()
    @IsString()
    triggerId?: string;
    @ApiProperty()
    @Type(() => Date)
    triggerAt: Date;
    @ApiProperty()
    @IsArray()
    executedJobs: string[];
    @ApiProperty()
    @IsArray()
    skippedJobs: string[];
}

export class CronExecutionDto {
    @ApiProperty()
    @IsString()
    id: string;
    @ApiProperty()
    @IsString()
    jobName: string;
    @ApiProperty()
    @Type(() => Date)
    executedAt: Date;
    @ApiProperty()
    @IsNumber()
    duration: number;
    @ApiProperty()
    @IsEnum(['AUTOMATIC', 'MANUAL'])
    trigger: 'AUTOMATIC' | 'MANUAL';
    @ApiProperty()
    @IsEnum(['SUCCESS', 'FAILED', 'TRIGGERED'])
    status: 'SUCCESS' | 'FAILED' | 'TRIGGERED';
    @ApiProperty()
    @IsString()
    error?: string;
    @ApiProperty()
    @IsObject()
    result?: any;
    @ApiProperty()
    @IsArray()
    executionLogs: string[];
}
