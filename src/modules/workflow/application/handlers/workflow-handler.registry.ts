import { Injectable, Logger } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface';
import { Inject } from '@nestjs/common';

export interface WorkflowTaskHandler {
  handle(requestData: Record<string, any>): Promise<Record<string, any>>;
}

@Injectable()
export class WorkflowHandlerRegistry {
  private readonly logger = new Logger(WorkflowHandlerRegistry.name);
  private readonly handlers = new Map<string, WorkflowTaskHandler>();

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {
    this.registerDefaultHandlers();
  }

  getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }

  private registerDefaultHandlers(): void {
    // Register UserNotRegisteredTaskHandler
    this.handlers.set(
      'ngo.NA.be.application.handler.task.UserNotRegisteredTaskHandler',
      {
        handle: async (requestData: Record<string, any>) => {
          if (!requestData.email) {
            throw new Error('Email is required for duplicate user check');
          }

          const existingUser = await this.userRepository.findByEmail(requestData.email);
          if (existingUser) {
            throw new Error(`User with email ${requestData.email} already exists`);
          }

          return { duplicate: false, email: requestData.email };
        },
      },
    );

    // Register Auth0UserCreationHandler
    this.handlers.set('Auth0UserCreationHandler', {
      handle: async (requestData: Record<string, any>) => {
        // This handler should create a user in Auth0
        // For now, return a mock result
        // In production, inject Auth0UserService and create the user
        this.logger.log(`Would create Auth0 user for: ${requestData.email}`);
        return {
          success: true,
          message: 'User creation initiated',
          email: requestData.email,
        };
      },
    });
  }

  registerHandler(handlerName: string, handler: WorkflowTaskHandler): void {
    this.handlers.set(handlerName, handler);
    this.logger.log(`Registered workflow handler: ${handlerName}`);
  }

  getHandler(handlerName: string): WorkflowTaskHandler | null {
    return this.handlers.get(handlerName) || null;
  }

  hasHandler(handlerName: string): boolean {
    return this.handlers.has(handlerName);
  }
}

