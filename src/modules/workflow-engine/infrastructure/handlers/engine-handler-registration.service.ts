import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { WorkflowTaskHandlerRegistry } from './workflow-task-handler-registry';
import { WORKFLOW_HANDLER_METADATA } from './workflow-handler.decorator';
import { WorkflowTaskHandler } from '../../application/interfaces/workflow-task-handler.interface';

/**
 * Service responsible for auto-discovering and registering workflow task handlers at module initialization.
 * 
 * Pattern: Automatic handler registration via decorator discovery
 * - Scans all providers in the module
 * - Finds classes decorated with @WorkflowHandler(name)
 * - Automatically registers them in the registry
 * - Zero manual configuration needed - just decorate your handlers!
 * 
 * Benefits:
 * - Add new handlers by just creating a class with @WorkflowHandler decorator
 * - No need to modify this service or module providers list
 * - Prevents forgetting to register handlers
 * - Clear discovery of all registered handlers via logs
 * 
 * @example
 * Create a new handler:
 * ```typescript
 * @WorkflowHandler('SendEmail')
 * @Injectable()
 * export class SendEmailHandler implements WorkflowTaskHandler {
 *   async handle(context, taskConfig) {
 *     // ... send email logic
 *   }
 * }
 * ```
 * 
 * Add to module providers:
 * ```typescript
 * @Module({
 *   providers: [SendEmailHandler, ...] // That's it! Auto-registered on init
 * })
 * ```
 */
@Injectable()
export class EngineHandlerRegistrationService implements OnModuleInit {
  private readonly logger = new Logger(EngineHandlerRegistrationService.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly registry: WorkflowTaskHandlerRegistry,
  ) {}

  async onModuleInit() {
    await this.discoverAndRegisterHandlers();
  }

  private async discoverAndRegisterHandlers(): Promise<void> {
    const providers = this.discoveryService.getProviders();
    let registeredCount = 0;

    for (const wrapper of providers) {
      const { instance, metatype } = wrapper;

      if (!instance || !metatype) {
        continue;
      }

      // Check if the class is decorated with @WorkflowHandler
      const handlerName = this.reflector.get<string>(
        WORKFLOW_HANDLER_METADATA,
        metatype,
      );

      if (handlerName) {
        // Verify it implements WorkflowTaskHandler interface
        if (this.isWorkflowTaskHandler(instance)) {
          this.registry.register(handlerName, instance as WorkflowTaskHandler);
          this.logger.log(
            `✓ Registered workflow handler: '${handlerName}' (${metatype.name})`,
          );
          registeredCount++;
        } else {
          this.logger.warn(
            `✗ Class '${metatype.name}' has @WorkflowHandler('${handlerName}') but does not implement WorkflowTaskHandler interface. Skipping.`,
          );
        }
      }
    }

    if (registeredCount === 0) {
      this.logger.warn(
        'No workflow handlers discovered. Make sure handlers are decorated with @WorkflowHandler(name).',
      );
    } else {
      this.logger.log(
        `✓ Successfully registered ${registeredCount} workflow handler(s)`,
      );
    }
  }

  private isWorkflowTaskHandler(instance: any): instance is WorkflowTaskHandler {
    return (
      instance &&
      typeof instance === 'object' &&
      'handle' in instance &&
      typeof instance.handle === 'function'
    );
  }
}
