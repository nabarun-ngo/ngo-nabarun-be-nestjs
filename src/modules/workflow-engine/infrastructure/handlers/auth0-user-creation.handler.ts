import { Injectable, Inject } from '@nestjs/common';
import { WorkflowTaskHandler } from '../../application/interfaces/workflow-task-handler.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { WorkflowHandler } from './workflow-handler.decorator';

/**
 * Example handler: Creates user in Auth0
 * Demonstrates external service integration
 * 
 * NOTE: This is a stub implementation. In production, inject Auth0ManagementService
 * and call actual Auth0 API to create user.
 */
@WorkflowHandler('Auth0UserCreation')
@Injectable()
export class Auth0UserCreationHandler implements WorkflowTaskHandler {
  constructor() {
    // TODO: @Inject() private readonly auth0Service: Auth0ManagementService
  }

  async handle(
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const inputData = taskConfig ?? {};
    const email = (inputData.email ?? context.email) as string;
    const firstName = (inputData.firstName ?? context.firstName) as string;
    const lastName = (inputData.lastName ?? context.lastName) as string;

    if (!email) {
      throw new BusinessException('Email is required for Auth0 user creation');
    }

    // TODO: Actual Auth0 API call
    // const auth0User = await this.auth0Service.createUser({
    //   email,
    //   name: `${firstName} ${lastName}`,
    //   connection: 'Username-Password-Authentication',
    // });

    // Stub response for demonstration
    const auth0User = {
      user_id: `auth0|${Date.now()}`,
      email,
      name: `${firstName} ${lastName}`,
      created_at: new Date().toISOString(),
    };

    return {
      auth0UserId: auth0User.user_id,
      email: auth0User.email,
      createdAt: auth0User.created_at,
    };
  }
}
