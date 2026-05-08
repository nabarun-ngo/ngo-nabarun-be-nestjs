import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IReportProvider, ReportGeneratedData, ReportProvider } from '../../../../reporting/domain/reporting.interface';
import { Role } from 'src/modules/user/domain/model/role.model';
import { ACTIVITY_REPOSITORY, type IActivityRepository } from '../../../domain/repositories/activity.repository.interface';
import { type IProjectRepository, PROJECT_REPOSITORY } from '../../../domain/repositories/project.repository.interface';
import { DocumentGeneratorService } from 'src/modules/shared/document-generator/services/document-generator.service';
import { formatDate } from 'src/shared/utilities/common.util';

@Injectable()
@ReportProvider()
export class ProjectReportProvider implements IReportProvider {
    readonly reportCode = 'PROJECT_REPORT';
    readonly displayName = 'Project Closure Report';
    readonly description = 'This report provides a consolidated overview of all activities of the organization ';
    readonly requiresApproval: boolean = false;
    readonly visibleToRoles: string[] = [Role.MEMBER];
    readonly approverRoles: string[] | undefined = undefined;
    readonly isActive: boolean = true;

    constructor(
        @Inject(PROJECT_REPOSITORY)
        private readonly projectRepository: IProjectRepository,
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: IActivityRepository,
        private readonly documentGenerator: DocumentGeneratorService,
    ) { }

    async generate(params: { projectId: string }): Promise<ReportGeneratedData> {
        const buffer = await this.template({ projectId: params.projectId });

        return {
            buffer,
            fileName: `Project_Closure_Report_${params.projectId}.xlsx`,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
    }




    private async template(request: { projectId: string }): Promise<Buffer> {
        const project = await this.projectRepository.findById(request.projectId);
        if (!project) {
            throw new NotFoundException(`Project with ID ${request.projectId} not found`);
        }

        const activities = await this.activityRepository.findAll({ projectId: request.projectId });

        const excelBuilder = this.documentGenerator.createExcelBuilder();
        const summarySheet = excelBuilder.addSheet({
            name: 'Project Summary',
            autoSizeColumns: true,
        });

        const allborder: any = { bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' } };

        summarySheet
            .setCell(1, 1, 'Project Closure Report', { font: { bold: true, size: 16 } })
            .setCell(3, 1, 'Project Details', { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: 'FFCC99' }, border: allborder })
            .setCell(4, 1, 'Name', { border: allborder }).setCell(4, 2, project.name, { border: allborder })
            .setCell(5, 1, 'Code', { border: allborder }).setCell(5, 2, project.code, { border: allborder })
            .setCell(6, 1, 'Category', { border: allborder }).setCell(6, 2, project.category, { border: allborder })
            .setCell(7, 1, 'Status', { border: allborder }).setCell(7, 2, project.status, { border: allborder })
            .setCell(8, 1, 'Phase', { border: allborder }).setCell(8, 2, project.phase, { border: allborder })
            .setCell(9, 1, 'Duration', { border: allborder }).setCell(9, 2, `${formatDate(project.startDate)} - ${project.endDate ? formatDate(project.endDate) : 'Ongoing'}`, { border: allborder })

            .setCell(11, 1, 'Financial Overview', { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: 'FFCC99' }, border: allborder })
            .setCell(12, 1, 'Total Budget', { border: allborder }).setCell(12, 2, project.budget || 0, { numFmt: '₹ #,##0.00', border: allborder })
            .setCell(13, 1, 'Total Spent', { border: allborder }).setCell(13, 2, project.spentAmount || 0, { numFmt: '₹ #,##0.00', border: allborder })
            .setCell(14, 1, 'Utilization', { border: allborder }).setCell(14, 2, `${project.getBudgetUtilization().toFixed(2)}%`, { border: allborder })

            .setCell(16, 1, 'Impact Summary', { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: 'FFCC99' }, border: allborder })
            .setCell(17, 1, 'Target Beneficiaries', { border: allborder }).setCell(17, 2, project.targetBeneficiaryCount || 0, { border: allborder })
            .setCell(18, 1, 'Actual Beneficiaries', { border: allborder }).setCell(18, 2, project.actualBeneficiaryCount || 0, { border: allborder });

        summarySheet.endSheet()
            .addSheet({
                name: 'Activities',
                freezePane: { row: 1 },
                columns: [
                    { header: 'Activity Name', key: 'name', width: 30 },
                    { header: 'Type', key: 'type', width: 15 },
                    { header: 'Scale', key: 'scale', width: 15 },
                    { header: 'Status', key: 'status', width: 15 },
                    { header: 'Start Date', key: 'startDate', width: 15 },
                    { header: 'End Date', key: 'endDate', width: 15 },
                    { header: 'Estimated Cost', key: 'estimatedCost', width: 15 },
                    { header: 'Actual Cost', key: 'actualCost', width: 15 },
                ]
            })
            .addRows(activities.map(a => ({
                name: a.name,
                type: a.type,
                scale: a.scale,
                status: a.status,
                startDate: a.startDate ? formatDate(a.startDate) : '',
                endDate: a.endDate ? formatDate(a.endDate) : '',
                estimatedCost: a.estimatedCost || 0,
                actualCost: a.actualCost || 0,
            })))
            .endSheet();

        return await excelBuilder.build();
    }
}
