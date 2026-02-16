import { Controller, Get, Header, Param, Query, Res, StreamableFile } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProduces, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Response as ExpressResponse } from 'express';
import { FinanceReportService } from "../../application/services/report.service";
import { ReportParamsDto } from "../../application/dto/report.dto";
import { CurrentUser } from "src/modules/shared/auth/application/decorators/current-user.decorator";
import { type AuthUser } from "src/modules/shared/auth/domain/models/api-user.model";
import { Readable } from "stream";
import { KeyValueDto } from "src/shared/dto/KeyValue.dto";
import { MetadataService } from "../../infrastructure/external/metadata.service";
import { SuccessResponse } from "src/shared/models/response-model";
import { toKeyValueDto } from "src/shared/utilities/kv-config.util";
import { ApiAutoResponse } from "src/shared/decorators/api-auto-response.decorator";
import { RequirePermissions } from "src/modules/shared/auth/application/decorators/require-permissions.decorator";

@ApiTags(FinanceReportController.name)
@Controller('finance-report')
@ApiBearerAuth('jwt') // Matches the 'jwt' security definition from main.ts
export class FinanceReportController {
    constructor(
        private readonly financeReportService: FinanceReportService,
        private readonly metadataService: MetadataService,
    ) { }

    @Get('list')
    @ApiOperation({ summary: 'Get list of reports' })
    @RequirePermissions('read:reports')
    @ApiAutoResponse(KeyValueDto, { description: 'Get list of reports', isArray: true, wrapInSuccessResponse: true })
    async getReportList(): Promise<SuccessResponse<KeyValueDto[]>> {
        return new SuccessResponse(
            (await this.metadataService.getReferenceData()).finance_reports.map(toKeyValueDto)
        )
    }


    @Get('generate/:reportName')
    @ApiOperation({ summary: 'Download a document file' })
    @RequirePermissions('read:reports')
    @ApiParam({ name: 'reportName', description: 'Report name', type: String })
    @ApiProduces('application/octet-stream')
    @ApiQuery({ name: 'on', description: 'Date on which the report should be generated', type: String, enum: ['paidOn', 'confirmedOn'], required: false })
    @ApiResponse({
        status: 200,
        description: 'File downloaded successfully',
        content: {
            'application/octet-stream': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Document not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
    async generateReport(
        @Param('reportName') reportName: string,
        @Query() query: ReportParamsDto,
        @CurrentUser() authUser: AuthUser,
        @Res({ passthrough: true }) res: ExpressResponse): Promise<StreamableFile> {

        const { fileName, contentType, buffer } = await this.financeReportService.generateReport(
            reportName,
            query,
            authUser.profile_id!,
            query.on
        );
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null); // End of stream
        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });

        return new StreamableFile(stream as any);
    }
}