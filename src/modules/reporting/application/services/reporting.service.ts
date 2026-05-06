import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ReportRegistryService } from './report-registry.service';
import { DmsService } from 'src/modules/shared/dms/application/services/dms.service';
import { DocumentMappingRefType } from 'src/modules/shared/dms/domain/mapping.model';
import { type IReportRepository, REPORT_REPOSITORY } from '../../domain/repositories/report.repository.interface';
import { Report, ReportStatus } from '../../domain/models/report.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IReportProvider } from '../providers/reporting.interface';
import { StartWorkflowUseCase } from 'src/modules/workflow/application/use-cases/start-workflow.use-case';

@Injectable()
export class ReportingService {
    private readonly logger = new Logger(ReportingService.name);

    constructor(
        private readonly registry: ReportRegistryService,
        private readonly dmsService: DmsService,
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepository: IReportRepository,
        private readonly eventBus: EventEmitter2,
        private readonly startWorkflowUseCase: StartWorkflowUseCase,
    ) { }

    async generateReport<T>(reportCode: string, params: T, authUserId: string) {
        const provider = this.registry.getProvider(reportCode);
        if (!provider) {
            throw new NotFoundException(`Report provider for ${reportCode} not found`);
        }
        const generatedData = await provider.generate(params);

        const report = Report.create({
            reportCode,
            requestedById: authUserId,
            parameters: params as Record<string, any>,
            needApproval: provider.requiresApproval,
            approvers: provider.approverRoles,
            viewers: provider.visibleToRoles,
        });
        await this.reportRepository.create(report);

        return this.processAndSaveReportDocument(provider, report, generatedData, authUserId);
    }

    async regenerateReport(reportId: string, authUserId: string) {
        const report = await this.reportRepository.findById(reportId);
        if (!report) {
            throw new NotFoundException(`Report not found`);
        }

        if (report.status === ReportStatus.APPROVED) {
            throw new BadRequestException(`Report is already approved`);
        }
        const provider = this.registry.getProvider(report.reportCode);
        if (!provider) {
            throw new NotFoundException(`Report provider for ${report.reportCode} not found`);
        }
        const generatedData = await provider.generate(report.parameters);

        return this.processAndSaveReportDocument(provider, report, generatedData, authUserId);
    }

    private async processAndSaveReportDocument(
        provider: IReportProvider,
        report: Report,
        generatedData: { buffer: Buffer; fileName: string; contentType: string },
        authUserId: string,
    ) {
        const { buffer, fileName, contentType } = generatedData;

        // Upload to DMS and capture the document ID
        const doc = await this.dmsService.uploadFile({
            fileBase64: buffer.toString('base64'),
            filename: fileName,
            contentType: contentType,
            documentMapping: [
                {
                    entityId: report.id,
                    entityType: DocumentMappingRefType.REPORT,
                },
            ],
        }, authUserId);

        report.incrementVersion(doc.id);

        if (provider.requiresApproval) {
            const workflow = await this.startWorkflowUseCase.execute({
                type: 'REPORT_REVIEW',
                data: {
                    reportCode: report.reportCode,
                    reportId: report.id,
                    reportName: provider.displayName,
                    roleNames: provider.approverRoles?.join(',') || '',
                },
                requestedBy: authUserId,
            });
            report.workflowId = workflow.id;
        } else {
            report.markApproved(authUserId);
        }
        await this.reportRepository.update(report.id, report);

        for (const event of report.domainEvents) {
            this.eventBus.emit(event.constructor.name, event);
        }

        return { buffer, fileName, contentType, reportId: report.id };
    }

    async approveReport(reportId: string, authUserId: string) {
        const report = await this.reportRepository.findById(reportId);
        if (!report) {
            throw new NotFoundException(`Report not found`);
        }
        if (!report.needApproval) {
            throw new BadRequestException(`Report does not require approval`);
        }
        if (report.status === ReportStatus.APPROVED) {
            throw new BadRequestException(`Report is already approved`);
        }
        report.markApproved(authUserId);
        await this.reportRepository.update(report.id, report);

        for (const event of report.domainEvents) {
            this.eventBus.emit(event.constructor.name, event);
        }
    }


}