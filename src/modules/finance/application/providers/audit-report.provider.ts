import { Injectable } from '@nestjs/common';
import { IReportProvider, ReportGeneratedData, ReportProvider } from '../../../reporting/application/providers/reporting.interface';
import { GenerateAnnualAuditUseCase } from 'src/modules/finance/application/use-cases/generate-annual-audit.use-case';
import { Role } from 'src/modules/user/domain/model/role.model';

@Injectable()
@ReportProvider()
export class AuditReportProvider implements IReportProvider {
    readonly reportCode = 'ANNUAL_AUDIT_REPORT';
    readonly displayName = 'Financial Year Audit Report';
    readonly description = 'This report provides a consolidated overview of all financial activities of the organization during the mentioned financial year, including income and expenditure details.';
    readonly requiresApproval = true;
    readonly approverRoles = [Role.TREASURER];
    readonly visibleToRoles = [Role.MEMBER];
    readonly isActive: boolean = true;

    constructor(
        private readonly auditUseCase: GenerateAnnualAuditUseCase,
    ) { }


    async generate(params: { financialYear: string }): Promise<ReportGeneratedData> {
        const buffer = await this.auditUseCase.execute({ financialYear: params.financialYear });

        return {
            buffer,
            fileName: `Annual_Audit_Report_FY_${params.financialYear}.xlsx`,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
    }
}
