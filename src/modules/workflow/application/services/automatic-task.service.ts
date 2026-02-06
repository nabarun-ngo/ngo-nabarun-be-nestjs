import { Inject, Injectable } from "@nestjs/common";
import { BusinessException } from "src/shared/exceptions/business-exception";
import { WorkflowTask } from "../../domain/model/workflow-task.model";
import { TaskDef, WorkflowDefinition } from "../../domain/vo/workflow-def.vo";
import { SignUpDto } from "src/modules/public/application/dto/public.dto";
import { WORKFLOW_INSTANCE_REPOSITORY } from "../../domain/repositories/workflow-instance.repository.interface";
import WorkflowInstanceRepository from "../../infrastructure/persistence/workflow-instance.repository";
import { CreateUserUseCase } from "src/modules/user/application/use-cases/create-user.use-case";
import { type IUserRepository, USER_REPOSITORY } from "src/modules/user/domain/repositories/user.repository.interface";

@Injectable()
export class AutomaticTaskService {

    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        @Inject(WORKFLOW_INSTANCE_REPOSITORY)
        private readonly workflowInstanceRepository: WorkflowInstanceRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository
    ) { }

    //TODO to be replaced with task handler
    async handleTask(task: WorkflowTask | TaskDef, requestData?: Record<string, any>, definition?: WorkflowDefinition): Promise<void> {
        switch (task.handler) {
            case 'Auth0UserCreationHandler':
                await this.createUser(requestData, task as WorkflowTask)
                break;
            case 'UserNotRegisteredTaskHandler':
                await this.checkIfAlreadyRegistered(requestData)
                break;
            case 'ValidateInputs':
                this.validateRequiredKeys(requestData, definition?.fields.filter(f => f.required).map(f => f.key)!,)
                break;
            default:
                throw new BusinessException(`Task handler not found: ${task.handler}`);
        }
    }
    private async checkIfAlreadyRegistered(requestData: Record<string, any> | undefined) {
        const users = await this.userRepository.findAll({
            email: requestData?.email!
        })
        if (users.length > 0) {
            throw new BusinessException(`User already registered: ${requestData?.email!}`);
        }
    }
    private async createUser(requestData: Record<string, any> | undefined, task: WorkflowTask) {
        const data = requestData as SignUpDto;
        const user = await this.createUserUseCase.execute({
            email: data.email!,
            firstName: data.firstName!,
            lastName: data.lastName!,
            phoneNumber: {
                code: data.dialCode!,
                number: data.contactNumber!,
            },
            isTemporary: false,
        })
        const workflowInstance = await this.workflowInstanceRepository.findById(task.workflowId!, false)
        workflowInstance?.updateInitiatedFor(user!);
        await this.workflowInstanceRepository.update(workflowInstance!.id!, workflowInstance!)
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