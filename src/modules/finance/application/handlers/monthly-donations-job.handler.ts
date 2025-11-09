import { Injectable, Inject } from '@nestjs/common';
//import { Cron, CronExpression } from '@nestjs/schedule';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';

import { Donation, DonationType } from '../../domain/model/donation.model';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Monthly Donations Job Handler
 * Automatically raises regular donations on 1st of every month
 */
@Injectable()
export class MonthlyDonationsJobHandler {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

  /**
   * Manual method to raise donations for a specific user
   * Useful for testing or manual intervention
   */
  async raiseRegularDonationForUser(
    donorId: string,
    amount: number,
    currency: string = 'USD',
  ): Promise<Donation> {
    const donation = Donation.createRegular({
      amount,
      currency,
      donorId,
      description: 'Monthly subscription donation',
      raisedDate: new Date(),
    });

    const savedDonation = await this.donationRepository.create(donation);

    // Emit events
    for (const event of donation.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    donation.clearEvents();

    return savedDonation;
  }
}
