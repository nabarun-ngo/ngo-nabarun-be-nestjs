import { ApiProperty } from "@nestjs/swagger";

export class KeyValueDto {
    @ApiProperty()
    description?: string;
    @ApiProperty()
    displayValue: string;
    @ApiProperty()
    key: string;
    @ApiProperty()
    active: boolean;
}
