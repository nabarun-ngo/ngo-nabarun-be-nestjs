import { Injectable } from "@nestjs/common";
import { UserService } from "src/modules/user/application/services/user.service";
import { BusinessException } from "src/shared/exceptions/business-exception";
import { WorkflowTask } from "../../domain/model/workflow-task.model";
import { TaskDef, WorkflowDefinition } from "../../domain/vo/workflow-def.vo";
import { SignUpDto } from "src/modules/public/application/dto/public.dto";

@Injectable()
export class AutomaticTaskService {

    constructor(private readonly userService: UserService) { }

    async handleTask(task: WorkflowTask | TaskDef, requestData?: Record<string, any>, definition?: WorkflowDefinition): Promise<void> {
        switch (task.handler) {
            case 'Auth0UserCreationHandler':
                await this.createUser(requestData)
                break;
            case 'UserNotRegisteredTaskHandler':
                await this.checkIfAlreadyRegistered(requestData)
                break;
            case 'ValidateInputs':
                this.validateRequiredKeys(requestData, definition?.fields!)
                break;
            default:
                throw new BusinessException(`Task handler not found: ${task.handler}`);
        }
    }
    private async checkIfAlreadyRegistered(requestData: Record<string, any> | undefined) {
        const users = await this.userService.list({
            props: {
                email: requestData?.email!
            }
        })
        if (users.content.length > 0) {
            throw new BusinessException(`User already registered: ${requestData?.email!}`);
        }
    }
    private async createUser(requestData: Record<string, any> | undefined) {
        const data = requestData as SignUpDto;
        await this.userService.create({
            email: data.email!,
            firstName: data.firstName!,
            lastName: data.lastName!,
            phoneNumber: {
                code: data.dialCode!,
                number: data.contactNumber!,
            },
            isTemporary: false,
        })
    }

    private validateRequiredKeys(
        data: Record<string, any> | undefined,
        required: string[],
    ) {
        if (!data) throw new BusinessException('Request data is missing');
        const missing = required.filter(k => !(k in data) || data[k] == null);
        if (missing.length) {
            throw new BusinessException(`Missing or null fields: ${missing.join(', ')}`);
        }
    }


}