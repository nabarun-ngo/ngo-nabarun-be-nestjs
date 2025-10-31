import { Injectable, Logger } from '@nestjs/common';
import { ProcessJob } from '../decorators/process-job.decorator';
import { JobResult } from '../interfaces/job.interface';
import type { Job } from '../interfaces/job.interface';

export interface NotificationJobData {
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationJobProcessor {
  private readonly logger = new Logger(NotificationJobProcessor.name);

  @ProcessJob({
    name: 'send-notification',
    concurrency: 10,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  })
  async processNotificationJob(job: Job<NotificationJobData>): Promise<JobResult> {
    try {
      this.logger.log(`Processing notification job: ${job.id} for user: ${job.data.userId}`);
      
      // Update progress
      await job.updateProgress(20);
      
      // Validate user
      const user = await this.validateUser(job.data.userId);
      await job.updateProgress(40);
      
      // Send notification based on type
      let result;
      switch (job.data.type) {
        case 'email':
          result = await this.sendEmailNotification(job.data);
          break;
        case 'sms':
          result = await this.sendSmsNotification(job.data);
          break;
        case 'push':
          result = await this.sendPushNotification(job.data);
          break;
        case 'in-app':
          result = await this.sendInAppNotification(job.data);
          break;
        default:
          throw new Error(`Unsupported notification type: ${job.data.type}`);
      }
      
      await job.updateProgress(80);
      
      // Log notification
      await this.logNotification(job.data, result);
      await job.updateProgress(100);
      
      this.logger.log(`Notification sent successfully: ${job.id}`);
      
      return {
        success: true,
        data: result,
        metadata: {
          userId: job.data.userId,
          type: job.data.type,
          priority: job.data.priority,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Notification failed: ${job.id}`, error);
      return {
        success: false,
        error: error.message,
        metadata: {
          userId: job.data.userId,
          type: job.data.type,
          failedAt: new Date().toISOString(),
        },
      };
    }
  }


  private async validateUser(userId: string): Promise<any> {
    // Simulate user validation
    await new Promise(resolve => setTimeout(resolve, 100));
    this.logger.log(`Validating user: ${userId}`);
    return { id: userId, email: 'user@example.com', phone: '+1234567890' };
  }

  private async sendEmailNotification(data: NotificationJobData): Promise<any> {
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 500));
    this.logger.log(`Email notification sent to user: ${data.userId}`);
    return { messageId: `email-${Date.now()}`, channel: 'email' };
  }

  private async sendSmsNotification(data: NotificationJobData): Promise<any> {
    // Simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 300));
    this.logger.log(`SMS notification sent to user: ${data.userId}`);
    return { messageId: `sms-${Date.now()}`, channel: 'sms' };
  }

  private async sendPushNotification(data: NotificationJobData): Promise<any> {
    // Simulate push notification
    await new Promise(resolve => setTimeout(resolve, 200));
    this.logger.log(`Push notification sent to user: ${data.userId}`);
    return { messageId: `push-${Date.now()}`, channel: 'push' };
  }

  private async sendInAppNotification(data: NotificationJobData): Promise<any> {
    // Simulate in-app notification
    await new Promise(resolve => setTimeout(resolve, 100));
    this.logger.log(`In-app notification sent to user: ${data.userId}`);
    return { messageId: `inapp-${Date.now()}`, channel: 'in-app' };
  }

  private async logNotification(data: NotificationJobData, result: any): Promise<void> {
    // Simulate logging
    await new Promise(resolve => setTimeout(resolve, 50));
    this.logger.log(`Notification logged: ${result.messageId}`);
  }
}
