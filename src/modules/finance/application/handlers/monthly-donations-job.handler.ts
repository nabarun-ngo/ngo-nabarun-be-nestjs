import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { type IUserRepository, USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';
import { UserStatus } from 'src/modules/user/domain/model/user.model';
import { DonationService } from '../services/donation.service';
import { DonationType } from '../../domain/model/donation.model';

/**
 * Monthly Donations Job Handler
 * Automatically raises regular donations on 1st of every month
 */
@Injectable()
export class MonthlyDonationsJobHandler {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly donationService: DonationService,
    private readonly eventEmitter: EventEmitter2,
  ) { }



  /**
   * Runs on 1st day of every month at 00:00
   * 
   */
  @Cron('0 10 1-5 * *', {
    name: 'raise-monthly-donations',
    timeZone: 'UTC',
  })
  async handleMonthlyDonations(): Promise<void> {
    console.log('[MonthlyDonationsJob] Starting monthly donation raise process...');
    const users = await this.userRepository.findAll({ status: UserStatus.ACTIVE });

    const now = new Date();
    // First date: set day to 1
    const firstDate = new Date(now.getFullYear(), now.getMonth(), 1);
    // Last date: set month to next month, day to 0 (last day of current month)
    const lastDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    for (const user of users) {
      try {
        // TODO: Get all active users with regular donation subscriptions
        // For now, this would need to fetch from UserProfile with donation settings

        await this.donationService.create({
          type: DonationType.REGULAR,
          amount: 150,
          donorId: user.id,
          startDate: firstDate,
          endDate: lastDate,
        });
        console.log(`[MonthlyDonationsJob] Monthly donation raised successfully for user: ${user.id}`);
      } catch (error) {
        console.warn(`[MonthlyDonationsJob] Error raising monthly donation for user: ${user.id} Error : ${error}`);
        // Consider sending alert/notification
      }
    }
  }

}
