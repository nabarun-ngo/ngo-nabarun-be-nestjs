// dms-upload.dto.ts
import { IsArray, IsBase64, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import type { DocumentMappingRefType } from '../../domain/mapping.model';
import { ApiProperty } from '@nestjs/swagger';

export class DmsUploadDto {
    @IsNotEmpty()
    @IsBase64()
    fileBase64: string;

    @IsNotEmpty()
    @IsString()
    filename: string; // example: "document.pdf"

    @IsNotEmpty()
    @IsString()
    contentType: string;

    @IsNotEmpty()
    @IsArray()

    documentMapping: DocMapDto[];


}

export class DocMapDto{
    @IsNotEmpty()
    @IsString()
    entityType: DocumentMappingRefType;

    @IsNotEmpty()
    @IsString()
    entityId: string;
}

