import { Injectable } from '@nestjs/common';
import { IReportProvider, ReportGeneratedData } from '../../../reporting/application/providers/reporting.interface';
import { GenerateDonationSummaryReportUseCase } from 'src/modules/finance/application/use-cases/generate-donation-summary.use-case';
import { DateTime } from 'luxon';
import { fileTypeFromBuffer } from 'file-type';
import { ReportProvider } from 'src/modules/reporting/application/providers/reporting.interface';
import { Role } from 'src/modules/user/domain/model/role.model';

@Injectable()
@ReportProvider()
export class DonationSummaryReportProvider implements IReportProvider<{ startDate: Date; endDate: Date; }> {
    readonly reportCode = 'DONATION_SUMMARY';
    readonly description = 'This report provides a consolidated overview of all donations received during the mentioned period, including donor-wise transaction details and any outstanding donations.';
    readonly displayName: string = 'Donation Summary Report';
    readonly requiresApproval = true;
    readonly approverRoles = [Role.TREASURER, Role.CASHIER, Role.ASSISTANT_CASHIER];
    readonly visibleToRoles = [Role.MEMBER];
    readonly isActive: boolean = true;
    constructor(
        private readonly donationSummaryUseCase: GenerateDonationSummaryReportUseCase,
    ) { }


    async generate(params: { startDate: Date; endDate: Date; }): Promise<ReportGeneratedData> {
        const buffer = await this.donationSummaryUseCase.execute({
            startDate: params.startDate!,
            endDate: params.endDate!,
            on: 'paidOn'
        });
        const startDt = DateTime.fromJSDate(params.startDate!).setZone('Asia/Kolkata');
        const endDt = DateTime.fromJSDate(params.endDate!).setZone('Asia/Kolkata');

        const startDate = startDt.toFormat('dd-MM-yyyy');
        const endDate = endDt.toFormat('dd-MM-yyyy');

        // Check if period is exactly one full month
        const isExactFullMonth = startDt.day === 1 && endDt.toFormat('yyyy-MM-dd') === startDt.endOf('month').toFormat('yyyy-MM-dd');
        const fileName = isExactFullMonth
            ? `Donation_Summary_Report-${startDt.toFormat('MMMM_yyyy')}.xlsx`
            : `Donation_Summary_Report-${startDate}_${endDate}.xlsx`;
        const fileType = (await fileTypeFromBuffer(buffer))?.mime ?? 'application/octet-stream';
        return { buffer, fileName, contentType: fileType };
    }


}
