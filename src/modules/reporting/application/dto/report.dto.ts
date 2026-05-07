import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Report, ReportStatus } from '../../domain/models/report.model';

export class ReportDetailDto {
    @ApiProperty({ description: 'The unique identifier of the report execution' })
    id: string;

    @ApiProperty({ description: 'The report code' })
    reportCode: string;

    @ApiProperty({ description: 'The report name' })
    reportName: string;

    @ApiProperty({ description: 'The ID of the user who requested the report' })
    requestedById?: string;

    @ApiProperty({ enum: ReportStatus, description: 'The current status of the report' })
    status: ReportStatus;

    @ApiProperty({ description: 'The parameters used to generate the report', type: Object })
    parameters?: Record<string, any>;

    @ApiProperty({ description: 'Whether the report requires approval' })
    needApproval: boolean;

    @ApiProperty({ description: 'The ID of the user who approved the report' })
    approvedBy?: string;

    @ApiProperty({ description: 'The timestamp when the report was approved' })
    approvedAt?: Date;

    @ApiProperty({ description: 'The roles that can approve the report', isArray: true, type: String })
    approvers?: string[];

    @ApiProperty({ description: 'The roles that can view the report', isArray: true, type: String })
    viewers: string[];

    @ApiProperty({ description: 'The DMS document ID associated with the report' })
    dmsDocumentId?: string;

    @ApiProperty({ description: 'The version of the report document' })
    version: number;

    @ApiProperty({ description: 'The workflow ID if approval is in progress' })
    workflowId?: string;

    @ApiProperty({ description: 'The timestamp when the report was created' })
    createdAt: Date;

    @ApiProperty({ description: 'The timestamp when the report was last updated' })
    updatedAt: Date;

    static fromDomain(report: Report): ReportDetailDto {
        return {
            id: report.id,
            reportCode: report.reportCode,
            requestedById: report.requestedById,
            status: report.status,
            parameters: report.parameters,
            needApproval: report.needApproval,
            approvedBy: report.approvedBy,
            approvedAt: report.approvedAt,
            approvers: report.approvers,
            viewers: report.viewers,
            dmsDocumentId: report.dmsDocumentId,
            version: report.version,
            workflowId: report.workflowId,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            reportName: report.reportName,
        } as ReportDetailDto;
    }
}

export class ReportFilterDto {
    @ApiProperty({ enum: ReportStatus, required: false, description: 'Filter by report status' })
    @IsOptional()
    @IsEnum(ReportStatus)
    status?: ReportStatus;

    @ApiProperty({ required: false, description: 'Filter by requester user ID' })
    @IsOptional()
    @IsString()
    requestedById?: string;
}
