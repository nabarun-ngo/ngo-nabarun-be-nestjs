import { ApiProperty } from "@nestjs/swagger";

export class KeyValue {
    @ApiProperty()
    description?: string;
    @ApiProperty()
    displayValue: string;
    @ApiProperty()
    key: string;
}
