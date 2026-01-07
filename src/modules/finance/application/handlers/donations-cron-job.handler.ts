import { Inject, Injectable } from '@nestjs/common';
import { CronLogger, getTraceId } from 'src/shared/utils/trace-context.util';
import { Cron } from '@nestjs/schedule';

import { type IUserRepository, USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';
import { UserStatus } from 'src/modules/user/domain/model/user.model';
import { Donation, DonationStatus, DonationType } from '../../domain/model/donation.model';
import { ConfigService } from '@nestjs/config';
import { Configkey } from 'src/shared/config-keys';
import { CreateDonationUseCase } from '../use-cases/create-donation.use-case';
import { DONATION_REPOSITORY, type IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { groupBy } from 'lodash';
import { JobProcessingService } from 'src/modules/shared/job-processing/services/job-processing.service';
import { JobName } from 'src/shared/job-names';
import { Backoffs } from 'bullmq';

/**
 * Monthly Donations Job Handler
 * Automatically raises regular donations on 1st of every month
 */
@Injectable()
export class DonationsCronJobHandler {
  private readonly logger = new CronLogger(DonationsCronJobHandler.name);
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
    private readonly configService: ConfigService,
    private readonly jobProcessingService: JobProcessingService,
  ) { }



  /**
   * Runs on 1st day of every month at 00:00
   * 
   */
  @Cron('0 0 1 * *', {
    name: 'raise-monthly-donations',
    timeZone: 'UTC',
  })
  async triggerMonthlyDonations(): Promise<void> {
    this.logger.log('[MonthlyDonationsJob] Triggering monthly donation raise process...');
    const users = await this.userRepository.findAll({ status: UserStatus.ACTIVE });
    for (const user of users) {
      await this.jobProcessingService.addJob(
        JobName.CREATE_DONATION,
        {
          userId: user.id,
          amount: user.donationAmount ?? Number(this.configService.get<number>(Configkey.PROP_DONATION_AMOUNT)),
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: false,
          removeOnFail: false,
        }
      );
    }
  }


  @Cron('0 0 1 * *', {
    name: 'mark-pending-donations',
    timeZone: 'UTC',
  })
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



  /**
   * 
   */

  @Cron('0 9 16-31/2 * *', {
    name: 'remind-pending-donations',
    timeZone: 'UTC',
  })
  async remindPendingDonations(): Promise<void> {
    this.logger.log('[PendingDonationsReminderJob] Triggering pending donations reminder process...');
    const donations = await this.donationRepository.findAll({ status: [DonationStatus.PENDING], isGuest: false });
    const userDonations = groupBy(donations, (donation) => donation.donorId);
    for (const [userId, donations] of Object.entries(userDonations)) {
      await this.jobProcessingService.addJob(
        JobName.SEND_DONATION_REMINDER_EMAIL,
        {
          donorId: userId,
          donorEmail: donations[0].donorEmail,
          donorName: donations[0].donorName,
        },
        {
          attempts: 1,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
    }
  }


}
