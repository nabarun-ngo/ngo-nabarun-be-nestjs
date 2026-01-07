import { OnEvent } from "@nestjs/event-emitter";
import { DonationRaisedEvent } from "../../domain/events/donation-raised.event";
import { Inject, Injectable } from "@nestjs/common";
import { DonationPaidEvent } from "../../domain/events/donation-paid.event";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { EmailTemplateName } from "src/shared/email-keys";
import { Logger } from "@nestjs/common";
import { DONATION_REPOSITORY, type IDonationRepository } from "../../domain/repositories/donation.repository.interface";

@Injectable()
export class DonationsEventHandler {
    private readonly logger = new Logger(DonationsEventHandler.name);

    constructor(private readonly correspondenceService: CorrespondenceService,
        @Inject(DONATION_REPOSITORY)
        private readonly donationRepository: IDonationRepository
    ) { }

    @OnEvent(DonationRaisedEvent.name, { async: true })
    async handleDonationRaisedEvent(event: DonationRaisedEvent) {
        this.logger.log(`Donation raised event start: ${event.donation.id}`);
        try {
            const donation = await this.donationRepository.findById(event.aggregateId);
            if (!donation?.donorEmail) {
                this.logger.warn(`No donor email found for donation ${donation?.id}`);
                return;
            }
            await this.correspondenceService.sendTemplatedEmail({
                templateName: EmailTemplateName.DONATION_CREATED,
                options: {
                    recipients: {
                        to: donation.donorEmail!,
                    }
                },
                data: {
                    donation: donation.toJson(),
                    donationPeriod: donation.startDate && donation.endDate ?
                        `${donation.startDate.toLocaleDateString()} to ${donation.endDate?.toLocaleDateString()}` :
                        'Not Applicable'
                }
            });
            this.logger.log(`Email sent successfully for donation ${donation.id}`);
        } catch (error) {
            this.logger.error(`Failed to send email for donation ${event.donation.id}`, error);
        }
        this.logger.log(`Donation raised event end: ${event.donation.id}`);
    }

    @OnEvent(DonationPaidEvent.name, { async: true })
    async handleDonationPaidEvent(event: DonationPaidEvent) {
        this.logger.log(`Donation paid event start: ${event.donation.id}`);
        try {
            const donation = await this.donationRepository.findById(event.aggregateId);
            if (!donation?.donorEmail) {
                this.logger.warn(`No donor email found for donation ${donation?.id}`);
                return;
            }
            await this.correspondenceService.sendTemplatedEmail({
                templateName: EmailTemplateName.DONATION_PAID,
                options: {
                    recipients: {
                        to: donation.donorEmail!,
                    }
                },
                data: {
                    paidOn: donation?.paidOn?.toLocaleDateString(),
                    confirmedByName: donation?.confirmedBy?.fullName,
                    donation: donation.toJson(),
                    donationPeriod: donation?.startDate && donation?.endDate ?
                        `${donation.startDate.toLocaleDateString()} to ${donation.endDate?.toLocaleDateString()}` :
                        'Not Applicable'
                }
            });
            this.logger.log(`Email sent successfully for donation ${donation.id}`);
        } catch (error) {
            this.logger.error(`Failed to send email for donation ${event.donation.id}`, error);
        }
        this.logger.log(`Donation paid event end: ${event.donation.id}`);
    }
}