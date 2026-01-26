import { OnEvent } from "@nestjs/event-emitter";
import { DonationRaisedEvent } from "../../domain/events/donation-raised.event";
import { Inject, Injectable } from "@nestjs/common";
import { DonationPaidEvent } from "../../domain/events/donation-paid.event";
import { DONATION_REPOSITORY, type IDonationRepository } from "../../domain/repositories/donation.repository.interface";
import { EmailTemplateName } from "src/shared/email-keys";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { CronLogger } from "src/shared/utils/trace-context.util";
import { JobName } from "src/shared/job-names";
import { UserStatus } from "src/modules/user/domain/model/user.model";
import { type IUserRepository, USER_REPOSITORY } from "src/modules/user/domain/repositories/user.repository.interface";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { ConfigService } from "@nestjs/config";
import { Configkey } from "src/shared/config-keys";
import { DonationStatus } from "../../domain/model/donation.model";
import { groupBy } from "lodash";
import { formatDate } from "src/shared/utilities/common.util";
import { ReportParamsDto } from "../dto/report.dto";

export class TriggerMonthlyDonationEvent { }
export class TriggerMarkDonationAsPendingEvent { }
export class TriggerRemindPendingDonationsEvent { }
export class GenerateDonationSummaryReportEvent { }

@Injectable()
export class DonationsEventHandler {
    private readonly logger = new CronLogger(DonationsEventHandler.name);

    constructor(
        @Inject(DONATION_REPOSITORY)
        private readonly donationRepository: IDonationRepository,
        private readonly correspondenceService: CorrespondenceService,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly jobProcessingService: JobProcessingService,
        private readonly configService: ConfigService,

    ) { }

    @OnEvent(DonationRaisedEvent.name, { async: true })
    async handleDonationRaisedEvent(event: DonationRaisedEvent) {
        this.logger.log(`Donation raised event start: ${event.donation.id}`);
        try {

            const donation = await this.donationRepository.findById(event.donation.id);
            if (!donation?.donorEmail) {
                this.logger.warn(`No donor email found for donation ${donation?.id}`);
                return;
            }

            await this.correspondenceService.sendTemplatedEmail({
                templateName: EmailTemplateName.DONATION_CREATED,
                options: {
                    recipients: {
                        to: donation.donorEmail,
                    },
                },
                data: {
                    donation: donation.toJson(),
                    donationPeriod: donation.startDate && donation.endDate
                        ? `${formatDate(donation.startDate)} - ${formatDate(donation.endDate)}`
                        : 'Not Applicable',
                },
            });

            this.logger.log(`Email sent successfully for donation ${donation.id}`);
        } catch (error) {
            this.logger.error(`Failed to send email for donation ${event.donation.id}`, error);
            throw error;
        }
        this.logger.log(`Donation raised event end: ${event.donation.id}`);
    }

    @OnEvent(DonationPaidEvent.name, { async: true })
    async handleDonationPaidEvent(event: DonationPaidEvent) {
        this.logger.log(`Donation paid event start: ${event.donation.id}`);
        try {
            const donation = await this.donationRepository.findById(event.donation.id);
            if (!donation?.donorEmail) {
                this.logger.warn(`No donor email found for donation ${donation?.id}`);
                return;
            }
            await this.correspondenceService.sendTemplatedEmail({
                templateName: EmailTemplateName.DONATION_PAID,
                options: {
                    recipients: {
                        to: donation.donorEmail,
                    },
                },
                data: {
                    paidOn: donation?.paidOn ? formatDate(donation?.paidOn) : 'Not Applicable',
                    confirmedByName: donation?.confirmedBy?.fullName,
                    donation: donation.toJson(),
                    donationPeriod: donation?.startDate && donation?.endDate
                        ? `${formatDate(donation.startDate)} - ${formatDate(donation.endDate)}`
                        : 'Not Applicable',
                },
            });
            this.logger.log(`Email sent successfully for donation ${donation.id}`);
        } catch (error) {
            this.logger.error(`Failed to send email for donation ${event.donation.id}`, error);
            throw error;
        }
        this.logger.log(`Donation paid event end: ${event.donation.id}`);
    }

    @OnEvent(TriggerMonthlyDonationEvent.name)
    async handleTriggerMonthlyDonationEvent(event: TriggerMonthlyDonationEvent) {
        this.logger.log('[MonthlyDonationsJob] Triggering monthly donation raise process...');
        const users = await this.userRepository.findAll({ status: UserStatus.ACTIVE });
        const defaultAmount = Number(this.configService.get<number>(Configkey.PROP_DONATION_AMOUNT));
        for (const user of users) {
            const amount = user.donationAmount && user.donationAmount > 0 ? user.donationAmount : defaultAmount;
            await this.jobProcessingService.addJob(
                JobName.CREATE_DONATION,
                {
                    userId: user.id,
                    amount: amount,
                },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                    removeOnComplete: false,
                    removeOnFail: false,
                    delay: 2000, // All jobs will become ready after 2 seconds
                }
            );
        }

        this.logger.log(`[MonthlyDonationsJob] Added ${users.length} donation jobs (concurrency: 4 will process them)`);
    }

    @OnEvent(TriggerMarkDonationAsPendingEvent.name, { async: true })
    async markPendingDonations(): Promise<void> {
        this.logger.log('[PendingDonationsJob] Starting mark pending donations process...');
        const raisedDonations = await this.donationRepository.findAll({ status: [DonationStatus.RAISED] })
        for (const donation of raisedDonations) {
            donation.markAsPending();
            await this.donationRepository.update(donation.id, donation);
            this.logger.log(`[PendingDonationsJob] Donation ${donation.id} marked as pending...`);
        }
        this.logger.log('[PendingDonationsJob] Completed mark pending donations process...');
    }

    @OnEvent(TriggerRemindPendingDonationsEvent.name, { async: true })
    async remindPendingDonations(): Promise<void> {
        this.logger.log('[PendingDonationsReminderJob] Triggering pending donations reminder process...');
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
                    attempts: 1,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                    removeOnComplete: true,
                    removeOnFail: false,
                    delay: 2000, // All jobs will become ready after 2 seconds
                }
            );
        }

        this.logger.log(`[PendingDonationsReminderJob] Added ${Object.keys(userDonations).length} reminder jobs (concurrency will process them)`);
    }

    @OnEvent(GenerateDonationSummaryReportEvent.name, { async: true })
    async generateDonationSummaryReport(): Promise<void> {
        this.logger.log('[GenerateDonationSummaryReportJob] Triggering donation summary report generation...');
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
                    sendEmail: 'Y'
                }
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: false,
                removeOnFail: false,
                delay: 2000, // All jobs will become ready after 2 seconds
            }
        );

        this.logger.log('[GenerateDonationSummaryReportJob] Jon Scheduled for donation summary report generation ...');
    }
}