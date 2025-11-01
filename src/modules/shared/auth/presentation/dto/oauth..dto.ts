import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class AuthCallbackDto {
    @IsString()
    @ApiProperty()
    code: string;
    @ApiProperty()
    @IsOptional()
    state?: string;
    @IsString()
    @ApiProperty()
    clientId: string;
}