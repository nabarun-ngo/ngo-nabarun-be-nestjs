import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';

/**
 * A safe EventEmitter2 wrapper that catches async errors
 * and prevents them from crashing the app.
 */
@Injectable()
export class AppEventEmitter  {
  private readonly logger = new Logger(AppEventEmitter.name);

  constructor(private readonly eventEmitter: EventEmitter2){}

  /**
   * Emits an event asynchronously without blocking.
   * Any thrown errors are caught and logged.
   */
  publish(event: string, ...args: any[]): void {
    this.eventEmitter.emitAsync(event, ...args).catch((err) => {
      this.handleError(err, event);
    });
  }

  /**
   * Handles listener errors (can be overridden or extended)
   */
  protected handleError(err: any, event: string): void {
    this.logger.error(`Error in listener for '${event}': ${err.message}`, err.stack);
    // Send Email to Admin
  }
}
