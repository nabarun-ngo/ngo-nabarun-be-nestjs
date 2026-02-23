import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { DonationRaisedEvent } from "../../domain/events/donation-raised.event";
import { Inject, Injectable } from "@nestjs/common";
import { DonationPaidEvent } from "../../domain/events/donation-paid.event";
import { DONATION_REPOSITORY, type IDonationRepository } from "../../domain/repositories/donation.repository.interface";
import { EmailTemplateName } from "src/shared/email-keys";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { JobName } from "src/shared/job-names";
import { UserStatus } from "src/modules/user/domain/model/user.model";
import { type IUserRepository, USER_REPOSITORY } from "src/modules/user/domain/repositories/user.repository.interface";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { ConfigService } from "@nestjs/config";
import { Configkey } from "src/shared/config-keys";
import { Donation, DonationStatus, DonationType } from "../../domain/model/donation.model";
import { groupBy } from "lodash";
import { formatDate } from "src/shared/utilities/common.util";
import { ReportParamsDto } from "../dto/report.dto";
import { SendNotificationRequestEvent } from "src/modules/shared/notification/application/events/send-notification-request.event";
import { NotificationCategory, NotificationPriority, NotificationType } from "src/modules/shared/notification/domain/models/notification.model";
import { NotificationKeys } from "src/shared/notification-keys";
import { UserDeletedEvent } from "src/modules/user/domain/events/user-deleted.event";
import { ApplyTryCatch } from "src/shared/decorators/apply-try-catch.decorator";
import { RootEvent } from "src/shared/models/root-event";
import { generateUniqueNDigitNumber } from "src/shared/utilities/password-util";

export class TriggerMonthlyDonationEvent extends RootEvent { }
export class TriggerMarkDonationAsPendingEvent extends RootEvent { }
export class TriggerRemindPendingDonationsEvent extends RootEvent { }
export class GenerateDonationSummaryReportEvent extends RootEvent { }

@Injectable()
export class DonationsEventHandler {
    constructor(
        @Inject(DONATION_REPOSITORY)
        private readonly donationRepository: IDonationRepository,
        private readonly correspondenceService: CorrespondenceService,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly jobProcessingService: JobProcessingService,
        private readonly configService: ConfigService,
        private readonly eventEmitter: EventEmitter2,

    ) { }

    @OnEvent(DonationRaisedEvent.name, { async: true })
    async handleDonationRaisedEvent(event: DonationRaisedEvent) {
        event.log(`Donation raised event start: ${event.donation.id}`);
        try {

            const donation = await this.donationRepository.findById(event.donation.id);
            if (!donation?.donorEmail) {
                event.log(`No donor email found for donation ${donation?.id}`);
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


            if (donation.donorId) {
                this.eventEmitter.emit(SendNotificationRequestEvent.name,
                    new SendNotificationRequestEvent({
                        targetUserIds: [donation.donorId!],
                        notificationKey: NotificationKeys.DONATION_CREATED,
                        type: NotificationType.INFO,
                        category: NotificationCategory.DONATION,
                        priority: NotificationPriority.HIGH,
                        data: {
                            donation: donation.toJson(),
                        },
                        referenceId: donation.id,
                        referenceType: 'donation',
                    }));
            }

        } catch (error) {
            event.error(`Failed to send email for donation ${event.donation.id}`, error);
            throw error;
        }
        event.log(`Donation raised event end: ${event.donation.id}`);
    }

    @OnEvent(DonationPaidEvent.name, { async: true })
    async handleDonationPaidEvent(event: DonationPaidEvent) {
        event.log(`Donation paid event start: ${event.donation.id}`);
        try {
            const donation = await this.donationRepository.findById(event.donation.id);
            if (!donation?.donorEmail) {
                event.warn(`No donor email found for donation ${donation?.id}`);
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
            if (donation.donorId) {
                this.eventEmitter.emit(SendNotificationRequestEvent.name,
                    new SendNotificationRequestEvent({
                        targetUserIds: [donation.donorId!],
                        notificationKey: NotificationKeys.DONATION_PAID,
                        type: NotificationType.INFO,
                        category: NotificationCategory.DONATION,
                        priority: NotificationPriority.HIGH,
                        data: {
                            donation: donation.toJson(),
                        },
                        referenceId: donation.id,
                        referenceType: 'donation',
                    }));
            }
        } catch (error) {
            event.error(`Failed to send email for donation ${event.donation.id}`, error);
            throw error;
        }
        event.log(`Donation paid event end: ${event.donation.id}`);
    }

    @OnEvent(TriggerMonthlyDonationEvent.name)
    @ApplyTryCatch()
    async handleTriggerMonthlyDonationEvent(event: TriggerMonthlyDonationEvent) {
        event.log('[MonthlyDonationsJob] Triggering monthly donation raise process...');
        const users = await this.userRepository.findAll({ status: UserStatus.ACTIVE });
        const defaultAmount = Number(this.configService.get<number>(Configkey.PROP_DONATION_AMOUNT));
        const today = new Date();
        for (const user of users) {
            if (user.donationPauseStart && user.donationPauseEnd &&
                user.donationPauseStart <= today && user.donationPauseEnd >= today) {
                event.warn(`Donation pause period (${user.donationPauseStart}-${user.donationPauseEnd}) found for user ${user.id}. Skipping donation creation.`);
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
                    delay: generateUniqueNDigitNumber(5),
                }
            );
        }

        event.log(`[MonthlyDonationsJob] Added ${users.length} donation jobs (concurrency: 4 will process them)`);
    }

    @OnEvent(TriggerMarkDonationAsPendingEvent.name, { async: true })
    @ApplyTryCatch()
    async markPendingDonations(event: TriggerMarkDonationAsPendingEvent): Promise<void> {
        event.log('[PendingDonationsJob] Starting mark pending donations process...');
        const raisedDonations = await this.donationRepository.findAll({ status: [DonationStatus.RAISED] })
        for (const donation of raisedDonations) {
            donation.markAsPending();
            await this.donationRepository.update(donation.id, donation);
            event.log(`[PendingDonationsJob] Donation ${donation.id} marked as pending...`);
        }
        event.log('[PendingDonationsJob] Completed mark pending donations process...');
    }

    @OnEvent(TriggerRemindPendingDonationsEvent.name, { async: true })
    @ApplyTryCatch()
    async remindPendingDonations(event: TriggerRemindPendingDonationsEvent): Promise<void> {
        event.log('[PendingDonationsReminderJob] Triggering pending donations reminder process...');
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
                    delay: generateUniqueNDigitNumber(5),
                }
            );
        }

        event.log(`[PendingDonationsReminderJob] Added ${Object.keys(userDonations).length} reminder jobs (concurrency will process them)`);
    }

    @OnEvent(GenerateDonationSummaryReportEvent.name, { async: true })
    @ApplyTryCatch()
    async generateDonationSummaryReport(event: GenerateDonationSummaryReportEvent): Promise<void> {
        event.log('[GenerateDonationSummaryReportJob] Triggering donation summary report generation...');
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
            }
        );

        event.log('[GenerateDonationSummaryReportJob] Jon Scheduled for donation summary report generation ...');
    }

    @OnEvent(UserDeletedEvent.name, { async: true })
    async handleUserDeletedEvent(event: UserDeletedEvent) {
        const user = event.user;
        event.log(`Processing user deletion for user: ${user.id}`);
        const donations = await this.donationRepository.findAll({ donorId: user.id, status: Donation.outstandingStatus });
        event.log(`Found ${donations.length} outstanding donations for user: ${user.id}`);
        for (const donation of donations) {
            donation.cancel();
            await this.donationRepository.update(donation.id, donation);
            event.log(`Cancelled donation: ${donation.id}`);
        }
        event.log(`Processed user deletion for user: ${user.id}`);
    }
}