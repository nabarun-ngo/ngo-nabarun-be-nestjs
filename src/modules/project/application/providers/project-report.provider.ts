import { Injectable } from '@nestjs/common';
import { IReportProvider, ReportGeneratedData, ReportProvider } from '../../../reporting/application/providers/reporting.interface';
import { GenerateProjectReportUseCase } from 'src/modules/project/application/use-cases/generate-project-report.use-case';
import { Role } from 'src/modules/user/domain/model/role.model';

@Injectable()
@ReportProvider()
export class ProjectReportProvider implements IReportProvider {
    readonly reportCode = 'PROJECT_REPORT';
    readonly displayName = 'Project Closure Report';
    readonly description = 'This report provides a consolidated overview of all activities of the organization ';
    readonly requiresApproval: boolean = false;
    readonly visibleToRoles: string[] = [Role.MEMBER];
    readonly approverRoles: string[] | undefined = undefined;

    constructor(
        private readonly projectReportUseCase: GenerateProjectReportUseCase,
    ) { }

    async generate(params: { projectId: string }): Promise<ReportGeneratedData> {
        const buffer = await this.projectReportUseCase.execute({ projectId: params.projectId });

        return {
            buffer,
            fileName: `Project_Closure_Report_${params.projectId}.xlsx`,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
    }
}
