import { Injectable } from "@nestjs/common";
import { BusinessException } from "src/shared/exceptions/business-exception";
import { WorkflowTask } from "../../domain/model/workflow-task.model";
import { TaskDef, WorkflowDefinition } from "../../domain/vo/workflow-def.vo";
import { IAutomaticTaskHandler } from "../automatic-task-handlers/automatic-task-handler.interface";
import { ValidateInputsHandler } from "../automatic-task-handlers/validate-inputs.handler";
import { Auth0UserCreationHandler } from "../automatic-task-handlers/auth0-user-creation.handler";
import { UserNotRegisteredTaskHandler } from "../automatic-task-handlers/user-not-registered.handler";
import { GuestDonationCreationHandler } from "../automatic-task-handlers/guest-donation-creation.handler";
import { UserDeleteAndDataCleanupHandler } from "../automatic-task-handlers/user-delete-and-data-cleanup.handler";

@Injectable()
export class AutomaticTaskService {
    private readonly handlers: Map<string, IAutomaticTaskHandler> = new Map();

    constructor(
        private readonly validateInputsHandler: ValidateInputsHandler,
        private readonly auth0UserCreationHandler: Auth0UserCreationHandler,
        private readonly userNotRegisteredTaskHandler: UserNotRegisteredTaskHandler,
        private readonly guestDonationCreationHandler: GuestDonationCreationHandler,
        private readonly userDeleteAndDataCleanupHandler: UserDeleteAndDataCleanupHandler,
    ) {
        this.registerHandler(this.validateInputsHandler);
        this.registerHandler(this.auth0UserCreationHandler);
        this.registerHandler(this.userNotRegisteredTaskHandler);
        this.registerHandler(this.guestDonationCreationHandler);
        this.registerHandler(this.userDeleteAndDataCleanupHandler);
    }

    private registerHandler(handler: IAutomaticTaskHandler) {
        this.handlers.set(handler.handlerName, handler);
    }

    async handleTask(task: WorkflowTask | TaskDef, requestData?: Record<string, any>, definition?: WorkflowDefinition): Promise<void> {
        if (!task.handler) {
            throw new BusinessException(`No handler defined for automatic task: ${task.name}`);
        }
        const handler = this.handlers.get(task.handler);
        if (!handler) {
            throw new BusinessException(`Task handler not found: ${task.handler}`);
        }
        await handler.handle(task, requestData, definition);
    }
}


