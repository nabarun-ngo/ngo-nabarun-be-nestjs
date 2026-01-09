import { ApiProperty } from "@nestjs/swagger";

export class CronJobDto {
    @ApiProperty()
    name: string;
    @ApiProperty()
    description: string;
    @ApiProperty()
    handler: string; // method name in service
    @ApiProperty()
    enabled: boolean;
    @ApiProperty()
    nextRun: Date;
}