import { Controller, Get, Post, Body, Param, Query, StreamableFile, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { ReportingService } from '../../application/services/reporting.service';
import { ReportRegistryService } from '../../application/services/report-registry.service';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';
import type { Response } from 'express';
import { Readable } from 'stream';
import { ApiAutoPagedResponse, ApiAutoResponse, ApiAutoVoidResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { KeyValueDto } from 'src/shared/dto/KeyValue.dto';
import { SuccessResponse } from 'src/shared/models/response-model';
import { ReportDetailDto, ReportFilterDto } from '../../application/dto/report.dto';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';

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
    @ApiAutoResponse(KeyValueDto, { isArray: true, description: 'List of reports that can be generated', wrapInSuccessResponse: true })
    async getRegisteredReports(): Promise<SuccessResponse<KeyValueDto[]>> {
        const providers = this.registry.getAllProviders().map(p => {
            return {
                key: p.reportCode,
                displayValue: p.displayName,
                description: p.description,
            } as KeyValueDto;
        });
        return new SuccessResponse(providers);
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
    @ApiAutoResponse(ReportDetailDto, { description: 'Report generated successfully', wrapInSuccessResponse: true })
    async generateReport(
        @Param('reportCode') reportCode: string,
        @Body() params: any,
        @CurrentUser() user: AuthUser,
    ) {
        const result = await this.reportingService.generateReport(reportCode, params, user.profile_id!);
        return new SuccessResponse(result);
    }

    /**
     * GET /report/list/:reportCode
     * Returns a paginated list of report executions for the given report code.
     */
    @Get('list/:reportCode')
    @ApiOperation({ summary: 'List report executions for a specific report' })
    @ApiParam({ name: 'reportCode', description: 'The unique code of the report' })
    @ApiQuery({ name: 'pageIndex', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    @ApiAutoPagedResponse(ReportDetailDto, { description: 'Paginated list of report executions', wrapInSuccessResponse: true })
    async listReports(
        @Param('reportCode') reportCode: string,
        @Query('pageIndex') pageIndex?: number,
        @Query('pageSize') pageSize?: number,
        @Query() filter?: ReportFilterDto,
    ): Promise<SuccessResponse<PagedResult<ReportDetailDto>>> {
        const result = await this.reportingService.findReports(
            reportCode,
            filter,
            pageIndex,
            pageSize,
        );

        return new SuccessResponse(result);
    }

    /**
     * POST /report/:reportId/approve
     * Approves a specific report.
     */
    @Post(':reportId/approve')
    @ApiOperation({ summary: 'Approve a report' })
    @ApiParam({ name: 'reportId', description: 'The ID of the report to approve' })
    @ApiAutoResponse(ReportDetailDto, { description: 'Report approved successfully', wrapInSuccessResponse: true })
    async approveReport(
        @Param('reportId') reportId: string,
        @CurrentUser() user: AuthUser,
    ) {
        const result = await this.reportingService.approveReport(reportId, user.profile_id!);
        return new SuccessResponse(result);
    }

    /**
     * POST /report/:reportId/regenerate
     * Regenerates a specific report.
     */
    @Post(':reportId/regenerate')
    @ApiOperation({ summary: 'Regenerate a report' })
    @ApiParam({ name: 'reportId', description: 'The ID of the report to regenerate' })
    @ApiAutoResponse(String, { description: 'Report regenerated successfully', wrapInSuccessResponse: true })
    async regenerateReport(
        @Param('reportId') reportId: string,
        @CurrentUser() user: AuthUser,
    ) {
        const result = await this.reportingService.regenerateReport(reportId, user.profile_id!);
        return new SuccessResponse(result);
    }

}
