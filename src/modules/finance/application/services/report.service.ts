import { Inject, Injectable } from "@nestjs/common";
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

    async generateReport(reportName: string, params: ReportParamsDto, authUserId: string): Promise<{
        fileName: string,
        contentType: string,
        buffer: Buffer
    }> {
        const buffer = await this.donationSummaryUseCase.execute({
            startDate: params.startDate!,
            endDate: params.endDate!
        });
        const period = `${formatDate(params.startDate!, { format: 'dd-MM-yyyy' })} to ${formatDate(params.endDate!, { format: 'dd-MM-yyyy' })}`
        const fileName = `Donation_Summary_Report_${period}_${formatDate(new Date(), { format: 'yyyyMMddHHmmss' })}.xlsx`;
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
                roleCodes: ['CASHIER', 'ASSISTANT_CASHIER', 'TREASURER']
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
                        reportPeriod: period,
                    },

                });
            }
        }

        return { fileName, contentType: fileType, buffer };
    }
}