import { Injectable, Inject } from '@nestjs/common';
import { WorkflowTaskHandler } from '../../application/interfaces/workflow-task-handler.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import type { IUserRepository } from 'src/modules/user/domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';
import { WorkflowHandler } from './workflow-handler.decorator';

/**
 * Example handler: Checks if user is NOT registered in the system
 * Used for conditional task execution (e.g., send invitation email only if not registered)
 */
@WorkflowHandler('UserNotRegistered')
@Injectable()
export class UserNotRegisteredHandler implements WorkflowTaskHandler {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async handle(
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const inputData = taskConfig ?? {};
    const email = (inputData.email ?? context.email) as string;

    if (!email) {
      throw new BusinessException('Email is required to check registration status');
    }

    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(email);

    return {
      isRegistered: !!existingUser,
      shouldSendInvitation: !existingUser,
      checkedAt: new Date().toISOString(),
    };
  }
}
