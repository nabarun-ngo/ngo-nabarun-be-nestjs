// dms.controller.ts
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { DmsService } from '../../application/services/dms.service';
import { DmsUploadDto } from '../dto/dms-upload.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { type DocumentMappingRefType } from '../../domain/mapping.model';
import { SuccessResponse } from 'src/shared/models/response-model';
import type { Response } from 'express';

@ApiBearerAuth('jwt')
@Controller('dms')
export class DmsController {
    constructor(private readonly dmsService: DmsService) { }

    @Post('upload')
    async uploadFile(@Body() body: DmsUploadDto) {
        const result = await this.dmsService.uploadFile(body);
        return new SuccessResponse<typeof result>(result);
    }

    @Get('document/:type/:id/list')
    async getDocuments(
        @Param('type') type: DocumentMappingRefType,
        @Param('id') id: string) {
        const result = await this.dmsService.getDocuments(type, id);
        return new SuccessResponse<typeof result>(result);
    }

    @Get('document/:id/view')
    async viewDocument(
        @Param('id') id: string) {
        const result = await this.dmsService.getSignedUrl(id);
        return new SuccessResponse<typeof result>(result);

    }

    @Get('document/:id/download')
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
