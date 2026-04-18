import { Inject, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProcessJob } from 'src/modules/shared/job-processing/application/decorators/process-job.decorator';
import { CorrespondenceService } from 'src/modules/shared/correspondence/services/correspondence.service';
import { DONATION_REPOSITORY, type IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { JobName } from 'src/shared/job-names';
import { EmailTemplateName } from 'src/shared/email-keys';
import { CreateDonationUseCase } from '../use-cases/create-donation.use-case';
import { Donation, DonationStatus, DonationType } from '../../domain/model/donation.model';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { formatDate } from 'src/shared/utilities/common.util';
import { FinanceReportService } from '../services/report.service';
import { type IUserRepository, USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';
import { ConfigService } from '@nestjs/config';
import { Configkey } from 'src/shared/config-keys';
import { User, UserStatus } from 'src/modules/user/domain/model/user.model';
import { groupBy } from 'lodash';
import { type JobExecutionContext } from 'src/modules/shared/job-processing/presentation/dto/job.dto';

@Injectable()
export class DonationJobsHandler {

    constructor(
        private readonly correspondenceService: CorrespondenceService,
        @Inject(DONATION_REPOSITORY)
        private readonly donationRepository: IDonationRepository,
        private readonly createDonationUseCase: CreateDonationUseCase,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly configService: ConfigService,
    ) { }


    // #region Donation Reminder
    @ProcessJob({
        name: JobName.TriggerRemindPendingDonationsEvent,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30 * 1000,
        }
    })
    async remindPendingDonations(job: Job<{ userId: string }>, ctx: JobExecutionContext): Promise<void> {
        job.log('[INFO] Starting pending donations reminder process...');
        var userId: string | undefined = undefined;
        if (job.data.userId) {
            job.log(`[INFO] Processing reminder only for user ${job.data.userId}`);
            userId = job.data.userId;
        }
        const donations = await this.donationRepository.findAll({ status: [DonationStatus.PENDING], isGuest: false, donorId: userId });
        job.log(`[INFO] Found ${donations.length} pending donations.`);
        const userDonations = groupBy(donations, (donation) => donation.donorId);
        job.log(`[INFO] Grouped ${Object.keys(userDonations).length} users with pending donations.`);
        let successCount = 0;
        for (const [userId, pendingDonations] of Object.entries(userDonations)) {
            if (pendingDonations.length === 0) {
                job.log(`[WARN] No valid donations found for reminder job ${job.id}`);
                continue;
            }
            if (!pendingDonations[0].donorEmail) {
                job.log(`[WARN] No donor email found for user ${userId}`);
                continue;
            }
            job.log(`[INFO] Sending reminder email for user ${userId}`);
            try {
                const templateData = await this.correspondenceService.getEmailTemplateData(EmailTemplateName.DONATION_REMINDER, {
                    data: {
                        donorName: pendingDonations[0].donorName,
                    },
                });

                templateData.body.content.table[0].data = [
                    ...templateData.body.content.table[0].data,
                    ...pendingDonations.map((donation) => {
                        return [
                            donation?.id,
                            `${formatDate(donation?.startDate!)} - ${formatDate(donation?.endDate!)}`,
                            `₹ ${donation?.amount}`,
                        ];
                    })];

                await this.correspondenceService.sendTemplatedEmail({
                    options: {
                        recipients: {
                            to: pendingDonations[0].donorEmail,
                        },
                    },
                    templateData,
                });

                job.log(`[INFO] Reminder email SENT to user ${userId} for ${pendingDonations.length} donations`);
                successCount++;
            } catch (error) {
                job.log(`[ERROR] Failed to send reminder email for user ${userId} : ${error.message}`);
                throw error;
            }
        }
        job.log(`[INFO] Sent reminder emails to ${successCount} users`);
    }

    // #endregion

    //#region Auto Create Donation

    @ProcessJob({
        name: JobName.CREATE_DONATION,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30 * 1000,
        }
    })
    async createDonation(job: Job<{
        userId: string,
        fullName: string,
        amount: number,
        firstDate: Date,
        lastDate: Date,
    }>) {
        const { userId, fullName, amount, firstDate, lastDate } = job.data;
        job.log(`[INFO] Creating monthly donation for user ${fullName} (${userId}) with amount ${amount} for period ${firstDate} - ${lastDate}`);
        try {
            const donation = await this.createDonationUseCase.execute({
                type: DonationType.REGULAR,
                amount: amount,
                donorId: userId,
                startDate: firstDate,
                endDate: lastDate,
                isGuest: false,
            });
            job.log(`[INFO] Monthly donation ${donation.id} raised successfully for user: ${fullName} (${userId})`);
        } catch (error) {
            if (error instanceof BusinessException) {
                job.log(`[WARN] Skipping user ${fullName} (${userId}): ${error.message}.`);
            } else {
                job.log(`[ERROR] Error raising monthly donation for user: ${fullName} (${userId}) Error : ${error}`);
                throw error;
            }
        }
    }

    @ProcessJob({
        name: JobName.TriggerMonthlyDonationEvent,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30 * 1000,
        }
    })
    async handleTriggerMonthlyDonationEvent(job: Job<{ userId?: string }>, ctx: JobExecutionContext) {
        job.log('[INFO] Triggering monthly donation raise process...');
        let users: User[] = [];
        if (job.data.userId) {
            job.log(`[INFO] Processing monthly donation only for user ${job.data.userId}`);
            const user = await this.userRepository.findById(job.data.userId);
            users = user ? [user] : [];
        } else {
            users = await this.userRepository.findAll({ status: UserStatus.ACTIVE });
        }
        job.log(`[INFO] Found ${users.length} active users.`);
        const defaultAmount = Number(this.configService.get<number>(Configkey.PROP_DONATION_AMOUNT));
        job.log(`[INFO] Default donation amount: ${defaultAmount}`);
        const today = new Date();
        // First date: set day to 1
        const firstDate = new Date(today.getFullYear(), today.getMonth(), 1);
        // Last date: set month to next month, day to 0 (last day of current month)
        const lastDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        for (const user of users) {
            // Check if user is in donation pause period
            if (user.donationPauseStart && user.donationPauseEnd &&
                user.donationPauseStart <= today && user.donationPauseEnd >= today) {
                job.log(`[WARN] Donation pause period (${user.donationPauseStart}-${user.donationPauseEnd}) found for user ${user.id}. Skipping donation creation.`);
                continue;
            }
            const amount = user.donationAmount && user.donationAmount > 0 ? user.donationAmount : defaultAmount;
            const jobId = ctx.addChildJob(JobName.CREATE_DONATION, {
                userId: user.id,
                fullName: user.fullName,
                amount: amount,
                firstDate: firstDate,
                lastDate: lastDate,
            });
            job.log(`[INFO] Added create donation job ${jobId} for user ${user.fullName} (${user.id}) with amount ${amount} for period ${firstDate} - ${lastDate}`);
        }
        job.log(`[INFO] Trigger monthly donation process completed.`);
    }

    //#endregion

    //#region Mark Donation as Pending
    @ProcessJob({
        name: JobName.TriggerMarkDonationAsPendingEvent,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30 * 1000,
        }
    })
    async markPendingDonations(job: Job<{ donationId?: string }>): Promise<void> {
        let raisedDonations: Donation[] = [];
        if (job.data.donationId) {
            job.log(`[INFO] Processing mark pending donation only for donation ${job.data.donationId}`);
            const donation = await this.donationRepository.findById(job.data.donationId);
            raisedDonations = donation ? [donation] : [];
        } else {
            job.log(`[INFO] Processing mark pending donation for all raised donations`);
            raisedDonations = await this.donationRepository.findAll({ status: [DonationStatus.RAISED] })
        }
        job.log(`[INFO] Found ${raisedDonations.length} raised donations.`);
        for (const donation of raisedDonations) {
            try {
                donation.markAsPending();
                await this.donationRepository.update(donation.id, donation);
                job.log(`[INFO] Donation ${donation.id} marked as pending...`);
            } catch (error) {
                job.log(`[ERROR] Error marking donation ${donation.id} as pending: ${error.message}`);
                throw error;
            }
        }
        job.log('[INFO] Mark pending donations process completed...');
    }

    //#endregion

    //#region Generate Donation Summary Report
    // @ProcessJob({
    //     name: JobName.GenerateDonationSummaryReportEvent,
    //     attempts: 3,
    //     backoff: {
    //         type: 'exponential',
    //         delay: 30 * 1000,
    //     }
    // })
    // async generateDonationSummaryReport(job: Job<{reportName: string, reportParams: ReportParamsDto}>, ctx: JobExecutionContext): Promise<void> {
    //     job.log('[GenerateDonationSummaryReportJob] Triggering donation summary report generation...');
    //     const now = new Date();
    //     // First date: set day to 1 (of previous month)
    //     const firstDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    //     // Last date: set month to current month, day to 0 (last day of previous month)
    //     const lastDate = new Date(now.getFullYear(), now.getMonth(), 0);

    //     ctx.addChildJob(JobName.GENERATE_REPORT, {
    //         reportName: 'DONATION_SUMMARY_REPORT',
    //         reportParams: {
    //             startDate: firstDate,
    //             endDate: lastDate,
    //             uploadFile: 'Y',
    //             sendEmail: 'N',
    //             on: 'paidOn'
    //         }
    //     });

    //     // await this.jobProcessingService.addChildrenToJob(job, [
    //     //     {
    //     //         name: JobName.GENERATE_REPORT,
    //     //         queueName: 'default',
    //     //         data: {
    //     //             reportName: 'DONATION_SUMMARY_REPORT',
    //     //             reportParams: {
    //     //                 startDate: firstDate,
    //     //                 endDate: lastDate,
    //     //                 uploadFile: 'Y',
    //     //                 sendEmail: 'Y',
    //     //                 on: 'paidOn'
    //     //             }
    //     //         }
    //     //     }
    //     // ]);

    //     job.log('[GenerateDonationSummaryReportJob] Flow created for donation summary report generation');
    // }

    //  @ProcessJob({
    //     name: JobName.GENERATE_REPORT,
    //     attempts: 3,
    //     backoff: {
    //         type: 'exponential',
    //         delay: 30 * 1000,
    //     }
    // })
    // async generateReport(job: Job<{
    //     reportName: string;
    //     reportParams: ReportParamsDto;
    // }>) {
    //     job.log(`Processing ${JobName.GENERATE_REPORT} for report ${job.data.reportName}`);
    //     try {
    //         await this.financeReportService.generateReport(
    //             job.data.reportName,
    //             job.data.reportParams,
    //             'System'
    //         );

    //         job.log(`Report ${job.data.reportName} generated successfully`);
    //     } catch (error) {
    //         job.log(`Failed to generate report ${job.data.reportName} : ${error.message}`);
    //         throw error;
    //     }
    // }
}
