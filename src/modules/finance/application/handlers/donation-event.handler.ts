import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { DonationRaisedEvent } from "../../domain/events/donation-raised.event";
import { Inject, Injectable } from "@nestjs/common";
import { DonationPaidEvent } from "../../domain/events/donation-paid.event";
import { DONATION_REPOSITORY, type IDonationRepository } from "../../domain/repositories/donation.repository.interface";
import { EmailTemplateName } from "src/shared/email-keys";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { Donation } from "../../domain/model/donation.model";
import { formatDate } from "src/shared/utilities/common.util";
import { SendNotificationRequestEvent } from "src/modules/shared/notification/application/events/send-notification-request.event";
import { NotificationCategory, NotificationPriority, NotificationType } from "src/modules/shared/notification/domain/models/notification.model";
import { NotificationKeys } from "src/shared/notification-keys";
import { UserDeletedEvent } from "src/modules/user/domain/events/user-deleted.event";

@Injectable()
export class DonationsEventHandler {
    constructor(
        @Inject(DONATION_REPOSITORY)
        private readonly donationRepository: IDonationRepository,
        private readonly correspondenceService: CorrespondenceService,
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