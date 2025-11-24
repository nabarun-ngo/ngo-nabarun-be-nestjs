// dms.controller.ts
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { DmsService } from '../../application/services/dms.service';
import { DmsUploadDto } from '../dto/dms-upload.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type DocumentMappingRefType } from '../../domain/mapping.model';
import { SuccessResponse } from 'src/shared/models/response-model';
import { ApiAutoResponse, ApiAutoPrimitiveResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { DocumentDto } from '../dto/document.dto';
import type { Response } from 'express';

@ApiTags('DMS')
@ApiBearerAuth('jwt')
@Controller('dms')
export class DmsController {
    constructor(private readonly dmsService: DmsService) { }

    @Post('upload')
    @ApiOperation({ summary: 'Upload a document' })
    @ApiAutoResponse(DocumentDto, { status: 201, description: 'Document uploaded successfully' })
    async uploadFile(@Body() body: DmsUploadDto): Promise<SuccessResponse<DocumentDto>> {
        const result = await this.dmsService.uploadFile(body);
        return new SuccessResponse<DocumentDto>(result);
    }

    @Get('document/:type/:id/list')
    @ApiOperation({ summary: 'Get all documents for a specific entity' })
    @ApiAutoResponse(DocumentDto, { isArray: true, description: 'List of documents retrieved successfully' })
    async getDocuments(
        @Param('type') type: DocumentMappingRefType,
        @Param('id') id: string): Promise<SuccessResponse<DocumentDto[]>> {
        const result = await this.dmsService.getDocuments(type, id);
        return new SuccessResponse<DocumentDto[]>(result);
    }

    @Get('document/:id/view')
    @ApiOperation({ summary: 'Get a signed URL to view a document' })
    @ApiAutoPrimitiveResponse('string', { description: 'Signed URL generated successfully' })
    async viewDocument(
        @Param('id') id: string): Promise<SuccessResponse<string>> {
        const result = await this.dmsService.getSignedUrl(id);
        return new SuccessResponse<string>(result);
    }

    @Get('document/:id/download')
    @ApiOperation({ summary: 'Download a document file' })
    // Note: This endpoint returns a stream, so Swagger response model is not applicable
    async downloadDocument(
        @Param('id') id: string,
        @Res() res: Response) {
        const { fileName: filename, stream: result } = await this.dmsService.downloadFile(id);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`,
        );
        result.pipe(res);
    }

}
