import { Inject, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProcessJob } from 'src/modules/shared/job-processing/decorators/process-job.decorator';
import { CorrespondenceService } from 'src/modules/shared/correspondence/services/correspondence.service';
import { DONATION_REPOSITORY, type IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { JobName } from 'src/shared/job-names';
import { EmailTemplateName } from 'src/shared/email-keys';
import { CreateDonationUseCase } from '../use-cases/create-donation.use-case';
import { Donation, DonationStatus, DonationType } from '../../domain/model/donation.model';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { formatDate } from 'src/shared/utilities/common.util';
import { ReportParamsDto } from '../dto/report.dto';
import { FinanceReportService } from '../services/report.service';
import { type IUserRepository, USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';
import { JobProcessingService } from 'src/modules/shared/job-processing/services/job-processing.service';
import { ConfigService } from '@nestjs/config';
import { Configkey } from 'src/shared/config-keys';
import { UserStatus } from 'src/modules/user/domain/model/user.model';
import { groupBy } from 'lodash';
import { generateUniqueNDigitNumber } from 'src/shared/utilities/password-util';

@Injectable()
export class DonationJobsHandler {

    constructor(
        private readonly correspondenceService: CorrespondenceService,
        @Inject(DONATION_REPOSITORY)
        private readonly donationRepository: IDonationRepository,
        private readonly createDonationUseCase: CreateDonationUseCase,
        private readonly financeReportService: FinanceReportService,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly jobProcessingService: JobProcessingService,
        private readonly configService: ConfigService,
    ) { }

    @ProcessJob({
        name: JobName.CREATE_DONATION,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        priority: 1
    })
    async createDonationForUser(job: Job<{ userId: string; amount: number }, Donation>) {
        job.log(`Processing ${JobName.CREATE_DONATION} for user ${job.data.userId}`);
        const now = new Date();
        // First date: set day to 1
        const firstDate = new Date(now.getFullYear(), now.getMonth(), 1);
        // Last date: set month to next month, day to 0 (last day of current month)
        const lastDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        try {
            const donation = await this.createDonationUseCase.execute({
                type: DonationType.REGULAR,
                amount: job.data.amount,
                donorId: job.data.userId,
                startDate: firstDate,
                endDate: lastDate,
                isGuest: false,
            });
            job.log(`[MonthlyDonationsJob] Monthly donation ${donation.id} raised successfully for user: ${job.data.userId}`);
            return donation.toJson();
        } catch (error) {
            if (error instanceof BusinessException) {
                job.log(`[MonthlyDonationsJob] Skipping user ${job.data.userId}: ${error.message}.`);
            } else {
                job.log(`[MonthlyDonationsJob] Error raising monthly donation for user: ${job.data.userId} Error : ${error}`);
                throw error;
            }
        }
    }

    @ProcessJob({
        name: JobName.SEND_DONATION_REMINDER_EMAIL,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30 * 1000,
        },
    })
    async sendDonationReminderEmail(job: Job<{
        donorEmail: string;
        donorId: string;
        donorName: string
    }>) {
        job.log(`Processing ${JobName.SEND_DONATION_REMINDER_EMAIL} for user ${job.data.donorEmail}`);
        try {
            const pendingDonations = await this.donationRepository.findAll({
                status: [DonationStatus.PENDING],
                isGuest: false,
                donorId: job.data.donorId
            });

            if (pendingDonations.length === 0) {
                job.log(`No valid donations found for reminder job ${job.id}`);
                return;
            }

            const templateData = await this.correspondenceService.getEmailTemplateData(EmailTemplateName.DONATION_REMINDER, {
                data: {
                    donorName: job.data.donorName,
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
                        to: job.data.donorEmail,
                    },
                },
                templateData,
            });

            job.log(`Reminder email SENT to user ${job.data.donorEmail} for ${pendingDonations.length} donations`);
        } catch (error) {
            job.log(`Failed to send reminder email for user ${job.data.donorEmail} : ${error.message}`);
            throw error;
        }
    }


    @ProcessJob({
        name: JobName.GENERATE_REPORT,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30 * 1000,
        }
    })
    async generateReport(job: Job<{
        reportName: string;
        reportParams: ReportParamsDto;
    }>) {
        job.log(`Processing ${JobName.GENERATE_REPORT} for report ${job.data.reportName}`);
        try {
            await this.financeReportService.generateReport(
                job.data.reportName,
                job.data.reportParams,
                'System'
            );

            job.log(`Report ${job.data.reportName} generated successfully`);
        } catch (error) {
            job.log(`Failed to generate report ${job.data.reportName} : ${error.message}`);
            throw error;
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
    async handleTriggerMonthlyDonationEvent(job: Job<any>) {
        job.log('[MonthlyDonationsJob] Triggering monthly donation raise process...');
        const users = await this.userRepository.findAll({ status: UserStatus.ACTIVE });
        const defaultAmount = Number(this.configService.get<number>(Configkey.PROP_DONATION_AMOUNT));
        const today = new Date();
        for (const user of users) {
            if (user.donationPauseStart && user.donationPauseEnd &&
                user.donationPauseStart <= today && user.donationPauseEnd >= today) {
                job.log(`Donation pause period (${user.donationPauseStart}-${user.donationPauseEnd}) found for user ${user.id}. Skipping donation creation.`);
                continue;
            }

            const amount = user.donationAmount && user.donationAmount > 0 ? user.donationAmount : defaultAmount;
            await this.jobProcessingService.addJob(
                JobName.CREATE_DONATION,
                {
                    userId: user.id,
                    amount: amount,
                },
                {
                    delay: generateUniqueNDigitNumber(3),
                    parent: { id: job.id!, queue: 'default' },
                }
            );
        }

        job.log(`[MonthlyDonationsJob] Added ${users.length} donation jobs.`);
    }

    @ProcessJob({
        name: JobName.TriggerMarkDonationAsPendingEvent,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30 * 1000,
        }
    })
    async markPendingDonations(job: Job<any>): Promise<void> {
        job.log('[PendingDonationsJob] Starting mark pending donations process...');
        const raisedDonations = await this.donationRepository.findAll({ status: [DonationStatus.RAISED] })
        for (const donation of raisedDonations) {
            donation.markAsPending();
            await this.donationRepository.update(donation.id, donation);
            job.log(`[PendingDonationsJob] Donation ${donation.id} marked as pending...`);
        }
        job.log('[PendingDonationsJob] Completed mark pending donations process...');
    }

    @ProcessJob({
        name: JobName.TriggerRemindPendingDonationsEvent,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30 * 1000,
        }
    })
    async remindPendingDonations(job: Job<any>): Promise<void> {
        job.log('[PendingDonationsReminderJob] Triggering pending donations reminder process...');
        const donations = await this.donationRepository.findAll({ status: [DonationStatus.PENDING], isGuest: false });
        const userDonations = groupBy(donations, (donation) => donation.donorId);

        // Add jobs - concurrency will handle processing rate
        // All jobs with same delay will become ready at same time, but concurrency limits simultaneous processing
        for (const [userId, userDonationsList] of Object.entries(userDonations)) {
            await this.jobProcessingService.addJob(
                JobName.SEND_DONATION_REMINDER_EMAIL,
                {
                    donorId: userId,
                    donorEmail: userDonationsList[0].donorEmail,
                    donorName: userDonationsList[0].donorName,
                },
                {
                    delay: generateUniqueNDigitNumber(3),
                    parent: { id: job.id!, queue: 'default' },
                }
            );
        }

        job.log(`[PendingDonationsReminderJob] Added ${Object.keys(userDonations).length} reminder jobs`);
    }

    @ProcessJob({
        name: JobName.GenerateDonationSummaryReportEvent,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30 * 1000,
        }
    })
    async generateDonationSummaryReport(job: Job<any>): Promise<void> {
        job.log('[GenerateDonationSummaryReportJob] Triggering donation summary report generation...');
        const now = new Date();
        // First date: set day to 1 (of previous month)
        const firstDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        // Last date: set month to current month, day to 0 (last day of previous month)
        const lastDate = new Date(now.getFullYear(), now.getMonth(), 0);
        await this.jobProcessingService.addJob<{ reportName: string; reportParams: ReportParamsDto }>(
            JobName.GENERATE_REPORT,
            {
                reportName: 'DONATION_SUMMARY_REPORT',
                reportParams: {
                    startDate: firstDate,
                    endDate: lastDate,
                    uploadFile: 'Y',
                    sendEmail: 'Y',
                    on: 'paidOn'
                }
            },
            {
                parent: { id: job.id!, queue: 'default' },
            }
        );

        job.log('[GenerateDonationSummaryReportJob] Jon Scheduled for donation summary report generation ...');
    }
}
