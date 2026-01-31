import { Injectable } from '@nestjs/common';
import { WorkflowTaskHandler } from '../../application/interfaces/workflow-task-handler.interface';
import { WorkflowTaskHandlerRegistry } from './workflow-task-handler-registry';
import { CreateUserUseCase } from 'src/modules/user/application/use-cases/create-user.use-case';
import { type IUserRepository, USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';
import { Inject } from '@nestjs/common';
import { BusinessException } from 'src/shared/exceptions/business-exception';

@Injectable()
export class UserNotRegisteredTaskHandler implements WorkflowTaskHandler {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async handle(
    context: Record<string, unknown>,
    _taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const requestData = (context.requestData || context) as Record<string, unknown>;
    const email = requestData?.email as string;
    if (!email) {
      throw new BusinessException('Email is required');
    }
    const users = await this.userRepository.findAll({ email });
    if (users.length > 0) {
      throw new BusinessException(`User already registered: ${email}`);
    }
    return {};
  }
}

@Injectable()
export class ValidateInputsHandler implements WorkflowTaskHandler {
  async handle(
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const requestData = (context.requestData || context) as Record<string, unknown>;
    const required =
      (taskConfig?.requiredFields as string[]) ??
      (taskConfig?.fields as string[]) ??
      [];
    if (!requestData) throw new BusinessException('Request data is missing');
    const missing = required.filter(
      (k) => !(k in requestData) || requestData[k] == null,
    );
    if (missing.length) {
      throw new BusinessException(`Missing or null fields: ${missing.join(', ')}`);
    }
    return {};
  }
}

@Injectable()
export class Auth0UserCreationHandler implements WorkflowTaskHandler {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async handle(
    context: Record<string, unknown>,
    _taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const requestData = (context.requestData || context) as Record<
      string,
      unknown
    >;
    const email = requestData?.email as string;
    const firstName = requestData?.firstName as string;
    const lastName = requestData?.lastName as string;
    const dialCode = (requestData?.dialCode as string) ?? '';
    const contactNumber = (requestData?.contactNumber as string) ?? '';
    if (!email || !firstName || !lastName) {
      throw new BusinessException('email, firstName, lastName are required');
    }
    const user = await this.createUserUseCase.execute({
      email,
      firstName,
      lastName,
      phoneNumber: { code: dialCode, number: contactNumber },
      isTemporary: false,
    });
    return { createdUser: user ? user.toJson() : null };
  }
}

export function registerEngineTaskHandlers(registry: WorkflowTaskHandlerRegistry) {
  // Handlers are registered in the module with their instances
}
