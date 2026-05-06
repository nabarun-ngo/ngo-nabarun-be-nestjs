import { Controller, Get, Post, Body, Param, Query, StreamableFile, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { ReportingService } from '../../application/services/reporting.service';
import { ReportRegistryService } from '../../application/services/report-registry.service';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';
import type { Response } from 'express';
import { Readable } from 'stream';
import { ApiAutoResponse, ApiAutoVoidResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { KeyValueDto } from 'src/shared/dto/KeyValue.dto';
import { SuccessResponse } from 'src/shared/models/response-model';

@ApiTags(ReportingController.name)
@Controller('report')
@ApiBearerAuth('jwt')
@ApiSecurity('api-key')
export class ReportingController {
    constructor(
        private readonly reportingService: ReportingService,
        private readonly registry: ReportRegistryService,
    ) { }

    /**
     * GET /reporting/registered-reports
     * Returns the list of all registered report providers.
     */
    @Get('registered-reports')
    @ApiOperation({ summary: 'Get list of reports that can be generated' })
    @ApiAutoResponse(KeyValueDto, { isArray: true, description: 'List of reports that can be generated' })
    async getRegisteredReports(): Promise<KeyValueDto[]> {
        return this.registry.getAllProviders().map(p => {
            return {
                key: p.reportCode,
                displayValue: p.displayName,
            } as KeyValueDto;
        });
    }

    /**
     * POST /reporting/trigger/:reportCode
     * Triggers a report generation for the given report code.
     * Uploads the result to DMS and sends email notifications.
     */
    @Post('generate/:reportCode')
    @ApiOperation({ summary: 'generate a report' })
    @ApiBody({
        schema: {
            type: 'object',
            additionalProperties: true
        },
        description: 'The parameters for the report generation.',
    })
    @ApiParam({ name: 'reportCode', description: 'The unique code of the report to generate', type: String })
    @ApiAutoResponse(String, { description: 'Report generated successfully', wrapInSuccessResponse: true })
    async generateReport(
        @Param('reportCode') reportCode: string,
        @Body() params: any,
        @CurrentUser() user: AuthUser,
    ) {
        const result = await this.reportingService.generateReport(reportCode, params, user.profile_id!);
        return new SuccessResponse({
            reportId: result.reportId,
            message: "Report generated successfully",
        });
    }

}
