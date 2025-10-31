import { OnEvent } from "@nestjs/event-emitter";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { UserCreatedEvent } from "../../domain/events/user-created.event";
import {  Injectable } from "@nestjs/common";

@Injectable()
export class UserEventsHandler {
    
  constructor(private readonly jobProcessingService: JobProcessingService) {}

  @OnEvent('UserCreatedEvent')
  async handleUserCreatedEvent(event: UserCreatedEvent) {
   await this.jobProcessingService.addJob('send-onboarding-email', {
    name: event.user.fullName,
    email: event.user.email,
    password: event.user.createPassword(),
   });
  }

}