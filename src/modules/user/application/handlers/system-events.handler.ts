import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { AppTechnicalError } from "src/shared/exceptions/app-tech-error";
import { Role } from "../../domain/model/role.model";
import { type IUserRepository, USER_REPOSITORY } from "../../domain/repositories/user.repository.interface";

@Injectable()
export class SystemEventsHandler {
    private readonly logger = new Logger(SystemEventsHandler.name);

    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly corrService: CorrespondenceService,
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
}
