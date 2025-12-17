import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { KeyValue } from "src/shared/dto/KeyValue.dto";

export class StaticDocumentDto {
    @ApiProperty()
    name: string;
    @ApiProperty({ type: [KeyValue], isArray: true })
    documents: KeyValue[];
}