import { Injectable, Logger } from "@nestjs/common";
import { CorrespondenceService } from "../services/correspondence.service";
import { OnEvent } from "@nestjs/event-emitter";
import { SlackNotificationRequestEvent } from "../events/slack-notification-request.event";

@Injectable()
export class NotificationHandler {
    private readonly logger = new Logger(NotificationHandler.name);

    constructor(
        private readonly corrService: CorrespondenceService,
    ) { }

    @OnEvent(SlackNotificationRequestEvent.name, { async: true })
    async handleSlackNotificationRequestEvent(event: SlackNotificationRequestEvent) {
        this.logger.log(`Handling ${SlackNotificationRequestEvent.name} event`)
        await this.corrService.sendSlackAlert(event.message, event.type);
    }

}