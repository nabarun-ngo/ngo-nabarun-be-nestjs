import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsOptional } from "class-validator";

export class ReportParamsDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    startDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    endDate?: Date;

    @ApiPropertyOptional({ enum: ['Y', 'N'] })
    @IsEnum(['Y', 'N'])
    uploadFile?: 'Y' | 'N';

    @ApiPropertyOptional({ enum: ['Y', 'N'] })
    @IsEnum(['Y', 'N'])
    sendEmail?: 'Y' | 'N';
}