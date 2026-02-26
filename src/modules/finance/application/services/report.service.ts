import { Inject, Injectable } from "@nestjs/common";
import { DateTime } from 'luxon';
import { GenerateDonationSummaryReportUseCase } from "../use-cases/generate-donation-summary.use-case";
import { DmsService } from "src/modules/shared/dms/application/services/dms.service";
import { DocumentMappingRefType } from "src/modules/shared/dms/domain/mapping.model";
import { fileTypeFromBuffer } from "file-type";
import { formatDate } from "src/shared/utilities/common.util";
import { ReportParamsDto } from "../dto/report.dto";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { EmailTemplateName } from "src/shared/email-keys";
import { type IUserRepository, USER_REPOSITORY } from "src/modules/user/domain/repositories/user.repository.interface";
import { Role } from "src/modules/user/domain/model/role.model";


@Injectable()
export class FinanceReportService {

    constructor(
        private readonly donationSummaryUseCase: GenerateDonationSummaryReportUseCase,
        private readonly dmsService: DmsService,
        private readonly correspondenceService: CorrespondenceService,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async generateReport(reportName: string, params: ReportParamsDto, authUserId: string, on?: 'paidOn' | 'confirmedOn'): Promise<{
        fileName: string,
        contentType: string,
        buffer: Buffer
    }> {
        const buffer = await this.donationSummaryUseCase.execute({
            startDate: params.startDate!,
            endDate: params.endDate!,
            on: on ?? 'confirmedOn'
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
        if (params.uploadFile === 'Y') {
            await this.dmsService.uploadFile({
                fileBase64: buffer.toString('base64'),
                filename: fileName,
                contentType: fileType,
                documentMapping: [
                    {
                        entityId: reportName,
                        entityType: DocumentMappingRefType.REPORT
                    }
                ]
            }, authUserId);
        }

        if (params.sendEmail === 'Y') {
            const users = await this.userRepository.findAll({
                roleCodes: [Role.CASHIER, Role.ASSISTANT_CASHIER, Role.TREASURER]
            });
            if (users.length > 0) {
                await this.correspondenceService.sendTemplatedEmail({
                    templateName: EmailTemplateName.DONATION_SUMMARY_REPORT,
                    options: {
                        recipients: {
                            to: users?.map((user) => user?.email),
                        },
                        attachments: [{
                            filename: fileName,
                            content: buffer,
                            contentType: fileType,
                        }]
                    },
                    data: {
                        reportPeriod: `${startDate} to ${endDate}`,
                    },

                });
            }
        }

        return { fileName, contentType: fileType, buffer };
    }
}