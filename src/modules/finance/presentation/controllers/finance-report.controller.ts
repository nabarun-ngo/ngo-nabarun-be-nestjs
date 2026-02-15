import { BadRequestException, Controller, Get, Header, Param, Query, Res, StreamableFile } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProduces, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Response as ExpressResponse } from 'express';
import { FinanceReportService } from "../../application/services/report.service";
import { ReportParamsDto, TrialBalanceReportDto, LedgerByAccountReportDto } from "../../application/dto/report.dto";
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
    @RequirePermissions('read:reports')
    @ApiOperation({ summary: 'Get list of reports' })
    @ApiAutoResponse(KeyValueDto, { description: 'Get list of reports', isArray: true, wrapInSuccessResponse: true })
    async getReportList(): Promise<SuccessResponse<KeyValueDto[]>> {
        return new SuccessResponse(
            (await this.metadataService.getReferenceData()).finance_reports.map(toKeyValueDto)
        )
    }

    @Get('trial-balance')
    @RequirePermissions('read:ledger')
    @ApiOperation({ summary: 'Get trial balance for a date range (from ledger entries)' })
    @ApiAutoResponse(TrialBalanceReportDto, { description: 'Trial balance report', wrapInSuccessResponse: true })
    async getTrialBalance(
        @Query('fromDate') fromDate: string,
        @Query('toDate') toDate: string,
    ): Promise<SuccessResponse<TrialBalanceReportDto>> {
        if (!fromDate || !toDate) {
            throw new BadRequestException('Query params fromDate and toDate are required (ISO date strings)');
        }
        const from = new Date(fromDate);
        const to = new Date(toDate);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
            throw new BadRequestException('fromDate and toDate must be valid dates');
        }
        const report = await this.financeReportService.getTrialBalance(from, to);
        return new SuccessResponse(report);
    }

    @Get('ledger/:accountId')
    @RequirePermissions('read:ledger')
    @ApiOperation({ summary: 'Get ledger by account (lines + closing balance, optional running balance)' })
    @ApiParam({ name: 'accountId', description: 'Account ID' })
    @ApiAutoResponse(LedgerByAccountReportDto, { description: 'Ledger by account report', wrapInSuccessResponse: true })
    async getLedgerByAccount(
        @Param('accountId') accountId: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('includeRunningBalance') includeRunningBalance?: string,
    ): Promise<SuccessResponse<LedgerByAccountReportDto>> {
        const from = fromDate ? new Date(fromDate) : undefined;
        const to = toDate ? new Date(toDate) : undefined;
        const include = includeRunningBalance === 'true' || includeRunningBalance === 'Y';
        const report = await this.financeReportService.getLedgerByAccount(
            accountId,
            from,
            to,
            include,
        );
        return new SuccessResponse(report);
    }

    @Get('trial-balance/download')
    @RequirePermissions('read:ledger')
    @ApiOperation({ summary: 'Download trial balance as Excel' })
    @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    @ApiResponse({ status: 200, description: 'Excel file', content: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } } } })
    @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
    async downloadTrialBalanceExcel(
        @Query('fromDate') fromDate: string,
        @Query('toDate') toDate: string,
        @Res({ passthrough: true }) res: ExpressResponse,
    ): Promise<StreamableFile> {
        if (!fromDate || !toDate) {
            throw new BadRequestException('Query params fromDate and toDate are required (ISO date strings)');
        }
        const from = new Date(fromDate);
        const to = new Date(toDate);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
            throw new BadRequestException('fromDate and toDate must be valid dates');
        }
        const { fileName, contentType, buffer } = await this.financeReportService.generateTrialBalanceExcel(from, to);
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        return new StreamableFile(stream as any);
    }

    @Get('ledger/:accountId/download')
    @RequirePermissions('read:ledger')
    @ApiOperation({ summary: 'Download ledger by account as Excel' })
    @ApiParam({ name: 'accountId', description: 'Account ID' })
    @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    @ApiResponse({ status: 200, description: 'Excel file', content: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } } } })
    @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
    async downloadLedgerByAccountExcel(
        @Res({ passthrough: true }) res: ExpressResponse,
        @Param('accountId') accountId: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('includeRunningBalance') includeRunningBalance?: string,
    ): Promise<StreamableFile> {
        const from = fromDate ? new Date(fromDate) : undefined;
        const to = toDate ? new Date(toDate) : undefined;
        const include = includeRunningBalance === 'true' || includeRunningBalance === 'Y';
        const { fileName, contentType, buffer } = await this.financeReportService.generateLedgerByAccountExcel(
            accountId,
            from,
            to,
            include,
        );
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        return new StreamableFile(stream as any);
    }

    @Get('generate/:reportName')
    @RequirePermissions('read:reports')
    @ApiOperation({ summary: 'Download a document file' })
    @ApiParam({ name: 'reportName', description: 'Report name', type: String })
    @ApiProduces('application/octet-stream')
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
            authUser.profile_id!
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