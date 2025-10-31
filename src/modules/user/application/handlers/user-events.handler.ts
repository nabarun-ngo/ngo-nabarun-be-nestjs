import { OnEvent } from "@nestjs/event-emitter";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { UserCreatedEvent } from "../../domain/events/user-created.event";
import {  Injectable } from "@nestjs/common";

@Injectable()
export class UserEventsHandler {
    
  constructor(private readonly jobProcessingService: JobProcessingService) {}

  @OnEvent('UserCreatedEvent')
  async handleUserCreatedEvent(event: UserCreatedEvent) {
    console.log(`Handling UserCreatedEvent for user ID: ${event.user.id}`);
    // Add job to send welcome email
    // await this.jobProcessingService.addJob('send-email', {
    //   userId: event.userId,
    //   email: event.email,
    // });
  }

}