import { Inject, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProcessJob } from 'src/modules/shared/job-processing/decorators/process-job.decorator';
import { CorrespondenceService } from 'src/modules/shared/correspondence/services/correspondence.service';
import { DONATION_REPOSITORY, type IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { JobName } from 'src/shared/job-names';
import { EmailTemplateName } from 'src/shared/email-keys';
import { CreateDonationUseCase } from '../use-cases/create-donation.use-case';
import { DonationStatus, DonationType } from '../../domain/model/donation.model';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { CronLogger } from 'src/shared/utils/trace-context.util';

@Injectable()
export class DonationJobsHandler {
    private readonly logger = new CronLogger(DonationJobsHandler.name);

    constructor(
        private readonly correspondenceService: CorrespondenceService,
        @Inject(DONATION_REPOSITORY)
        private readonly donationRepository: IDonationRepository,
        private readonly createDonationUseCase: CreateDonationUseCase,

    ) { }

    @ProcessJob({
        name: JobName.CREATE_DONATION,
    })
    async createDonationForUser(job: Job<{ userId: string; amount: number }>) {
        this.logger.log(`Processing ${JobName.CREATE_DONATION} for user ${job.data.userId}`);
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
            this.logger.log(`[MonthlyDonationsJob] Monthly donation ${donation.id} raised successfully for user: ${job.data.userId}`);
        } catch (error) {
            if (error instanceof BusinessException) {
                this.logger.log(`[MonthlyDonationsJob] Skipping user ${job.data.userId}: Donation already exists.`);
            } else {
                this.logger.error(`[MonthlyDonationsJob] Error raising monthly donation for user: ${job.data.userId} Error : ${error}`);
                throw error;
            }
        }
    }

    @ProcessJob({
        name: JobName.SEND_DONATION_REMINDER_EMAIL,
    })
    async sendDonationReminderEmail(job: Job<{
        donorEmail: string;
        donorId: string;
        donorName: string
    }>) {
        this.logger.log(`Processing ${JobName.SEND_DONATION_REMINDER_EMAIL} for user ${job.data.donorEmail}`);
        try {
            const pendingDonations = await this.donationRepository.findAll({
                status: [DonationStatus.PENDING],
                isGuest: false,
                donorId: job.data.donorId
            });

            if (pendingDonations.length === 0) {
                this.logger.log(`No valid donations found for reminder job ${job.id}`);
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
                        `${donation?.startDate?.toLocaleDateString()} - ${donation?.endDate?.toLocaleDateString()}`,
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

            this.logger.log(`Reminder email SENT to user ${job.data.donorEmail} for ${pendingDonations.length} donations`);
        } catch (error) {
            this.logger.error(`Failed to send reminder email for user ${job.data.donorEmail}`, error);
            throw error;
        }
    }
}
