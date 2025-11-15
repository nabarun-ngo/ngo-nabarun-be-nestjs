// dms.controller.ts
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { DmsService } from '../../application/services/dms.service';
import { DmsUploadDto } from '../dto/dms-upload.dto';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { UseApiKey } from 'src/modules/shared/auth/application/decorators/use-api-key.decorator';
import { type DocumentMappingRefType } from '../../domain/mapping.model';
import { SuccessResponse } from 'src/shared/models/response-model';
import type { Response } from 'express';

@ApiSecurity('api-key') // Apply the 'api-key' security definition
@ApiBearerAuth('jwt')
@Controller('dms')
@UseApiKey()
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
