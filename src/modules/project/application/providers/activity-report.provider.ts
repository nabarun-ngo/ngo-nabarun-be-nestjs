import { Injectable } from '@nestjs/common';
import { ReportProvider } from '../../../reporting/application/providers/reporting.interface';
import { IReportProvider, ReportGeneratedData } from '../../../reporting/application/providers/reporting.interface';
import { GenerateActivityReportUseCase } from 'src/modules/project/application/use-cases/generate-activity-report.use-case';
import { Role } from 'src/modules/user/domain/model/role.model';

@Injectable()
@ReportProvider()
export class ActivityReportProvider implements IReportProvider {
    readonly reportCode = 'ACTIVITY_REPORT';
    readonly description = 'This report provides a consolidated status of all the activities under the project';
    readonly requiresApproval = false;
    readonly visibleToRoles: string[] = [Role.MEMBER];
    readonly approverRoles: string[] | undefined = undefined;
    readonly displayName: string = 'Activity Closure Report';
    readonly isActive: boolean = true;

    constructor(
        private readonly activityReportUseCase: GenerateActivityReportUseCase,
    ) { }

    async generate(params: { activityId: string }): Promise<ReportGeneratedData> {
        const buffer = await this.activityReportUseCase.execute({ activityId: params.activityId });

        return {
            buffer,
            fileName: `Activity_Report_${params.activityId}.xlsx`,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
    }

}
