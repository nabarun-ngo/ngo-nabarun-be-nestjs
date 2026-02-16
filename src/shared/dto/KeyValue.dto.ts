import { ApiProperty } from "@nestjs/swagger";

export class KeyValueDto {
    @ApiProperty()
    description?: string;
    @ApiProperty()
    displayValue: string;
    @ApiProperty()
    value: any;
    @ApiProperty()
    key: string;
    @ApiProperty()
    active: boolean;
}
