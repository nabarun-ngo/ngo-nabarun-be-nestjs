import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { AppTechnicalError } from "src/shared/exceptions/app-tech-error";
import { Role } from "../modules/user/domain/model/role.model";
import { type IUserRepository, USER_REPOSITORY } from "../modules/user/domain/repositories/user.repository.interface";
import { DomainEvent } from "./models/domain-event";
import { RedisHashCacheService } from "src/modules/shared/database/redis-hash-cache.service";
import { DomainEventPayload } from "./dto/domain-event-payload.dto";

export const APP_DOMAIN_EVENTS_KEY = 'app:domain_events';

@Injectable()
export class SystemEventsHandler {
    private readonly logger = new Logger(SystemEventsHandler.name);

    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly corrService: CorrespondenceService,
        private readonly redisCache: RedisHashCacheService,
    ) { }

    @OnEvent(AppTechnicalError.name, { async: true })
    async handleAppTechnicalError(event: AppTechnicalError) {
        try {
            const users = await this.userRepository.findAll({
                roleCodes: [Role.TECHNICAL_SPECIALIST]
            });

            if (users.length > 0) {
                await this.corrService.sendEmail({
                    subject: '[NABARUN] App Technical Error',
                    html: `
            <div>
              <h1>App Technical Error</h1>
              <p>${JSON.stringify(event.error, null, 2)}</p>
              <p>Please review slack <a href="https://app.slack.com/client">#prod_errors</a> channel for more details.</p>
            </div>
            `,
                    to: users.map(m => m.email).join(',')
                })
                this.logger.log(`Sent technical error notification to ${users.length} specialists.`);
            }
        } catch (error) {
            this.logger.error(`Failed to handle AppTechnicalError: ${error.message}`, error.stack);
        }
    }

    @OnEvent('**', { async: true })
    async handleAllEvents(event: any) {
        if (event && event instanceof DomainEvent) {
            try {
                const payload = {
                    aggregateId: event.aggregateId,
                    eventName: event.constructor.name,
                    occurredAt: event.occurredAt,
                    data: event.domain.toJson(),
                } as DomainEventPayload;
                await this.redisCache.pushToList(APP_DOMAIN_EVENTS_KEY, 'events', payload, 10000, 86400 * 1);//1 Day
                this.logger.debug(`Cached domain event for auto-close evaluation: ${event.constructor.name} on aggregate: ${event.aggregateId}`);
            } catch (error) {
                this.logger.error(`Failed to cache domain event for workflow evaluation: ${error.message}`, error.stack);
            }
        }
    }
}
