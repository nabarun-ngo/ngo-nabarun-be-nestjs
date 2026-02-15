import { Inject, Injectable } from "@nestjs/common";
import { GenerateDonationSummaryReportUseCase } from "../use-cases/generate-donation-summary.use-case";
import { GetTrialBalanceUseCase } from "../use-cases/get-trial-balance.use-case";
import { GetLedgerByAccountUseCase } from "../use-cases/get-ledger-by-account.use-case";
import { GenerateTrialBalanceExcelUseCase } from "../use-cases/generate-trial-balance-excel.use-case";
import { GenerateLedgerByAccountExcelUseCase } from "../use-cases/generate-ledger-by-account-excel.use-case";
import { DmsService } from "src/modules/shared/dms/application/services/dms.service";
import { DocumentMappingRefType } from "src/modules/shared/dms/domain/mapping.model";
import { fileTypeFromBuffer } from "file-type";
import { formatDate } from "src/shared/utilities/common.util";
import { ReportParamsDto, TrialBalanceReportDto, LedgerByAccountReportDto } from "../dto/report.dto";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { EmailTemplateName } from "src/shared/email-keys";
import { type IUserRepository, USER_REPOSITORY } from "src/modules/user/domain/repositories/user.repository.interface";
import { Role } from "src/modules/user/domain/model/role.model";


@Injectable()
export class FinanceReportService {

    constructor(
        private readonly donationSummaryUseCase: GenerateDonationSummaryReportUseCase,
        private readonly getTrialBalanceUseCase: GetTrialBalanceUseCase,
        private readonly getLedgerByAccountUseCase: GetLedgerByAccountUseCase,
        private readonly generateTrialBalanceExcelUseCase: GenerateTrialBalanceExcelUseCase,
        private readonly generateLedgerByAccountExcelUseCase: GenerateLedgerByAccountExcelUseCase,
        private readonly dmsService: DmsService,
        private readonly correspondenceService: CorrespondenceService,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async getTrialBalance(fromDate: Date, toDate: Date): Promise<TrialBalanceReportDto> {
        return this.getTrialBalanceUseCase.execute({ fromDate, toDate });
    }

    async getLedgerByAccount(
        accountId: string,
        fromDate?: Date,
        toDate?: Date,
        includeRunningBalance?: boolean,
    ): Promise<LedgerByAccountReportDto> {
        return this.getLedgerByAccountUseCase.execute({
            accountId,
            fromDate,
            toDate,
            includeRunningBalance: includeRunningBalance ?? false,
        });
    }

    async generateTrialBalanceExcel(
        fromDate: Date,
        toDate: Date,
    ): Promise<{ fileName: string; contentType: string; buffer: Buffer }> {
        const buffer = await this.generateTrialBalanceExcelUseCase.execute({ fromDate, toDate });
        const fromStr = formatDate(fromDate, { format: 'dd-MM-yyyy' });
        const toStr = formatDate(toDate, { format: 'dd-MM-yyyy' });
        const fileName = `Trial_Balance_${fromStr}_${toStr}.xlsx`;
        return {
            fileName,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            buffer,
        };
    }

    async generateLedgerByAccountExcel(
        accountId: string,
        fromDate?: Date,
        toDate?: Date,
        includeRunningBalance?: boolean,
    ): Promise<{ fileName: string; contentType: string; buffer: Buffer }> {
        const buffer = await this.generateLedgerByAccountExcelUseCase.execute({
            accountId,
            fromDate,
            toDate,
            includeRunningBalance: includeRunningBalance ?? true,
        });
        const fromStr = fromDate ? formatDate(fromDate, { format: 'dd-MM-yyyy' }) : 'all';
        const toStr = toDate ? formatDate(toDate, { format: 'dd-MM-yyyy' }) : 'all';
        const fileName = `Ledger_Account_${accountId}_${fromStr}_${toStr}.xlsx`;
        return {
            fileName,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            buffer,
        };
    }

    async generateReport(reportName: string, params: ReportParamsDto, authUserId: string): Promise<{
        fileName: string,
        contentType: string,
        buffer: Buffer
    }> {
        const buffer = await this.donationSummaryUseCase.execute({
            startDate: params.startDate!,
            endDate: params.endDate!
        });
        const startDate = formatDate(params.startDate!, { format: 'dd-MM-yyyy' });
        const endDate = formatDate(params.endDate!, { format: 'dd-MM-yyyy' });
        const fileName = `Donation_Summary_Report_${startDate}_${endDate}.xlsx`;
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