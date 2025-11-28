import { Injectable } from '@nestjs/common';
//import { Cron, CronExpression } from '@nestjs/schedule';

import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Monthly Donations Job Handler
 * Automatically raises regular donations on 1st of every month
 */
@Injectable()
export class MonthlyDonationsJobHandler {
  constructor(

    private readonly eventEmitter: EventEmitter2,
  ) { }

  /**
   * Runs on 1st day of every month at 00:00
   */
  //   @Cron('0 0 1 * *', {
  //     name: 'raise-monthly-donations',
  //     timeZone: 'UTC',
  //   })
  async handleMonthlyDonations(): Promise<void> {
    console.log('[MonthlyDonationsJob] Starting monthly donation raise process...');

    try {
      // TODO: Get all active users with regular donation subscriptions
      // For now, this would need to fetch from UserProfile with donation settings
      // const activeSubscribers = await this.userRepository.findActiveSubscribers();

      // For each subscriber, create a RAISED donation
      // This is a placeholder - you'll need to implement user subscription logic

      console.log('[MonthlyDonationsJob] Monthly donations raised successfully');
    } catch (error) {
      console.error('[MonthlyDonationsJob] Error raising monthly donations:', error);
      // Consider sending alert/notification
    }
  }

}
