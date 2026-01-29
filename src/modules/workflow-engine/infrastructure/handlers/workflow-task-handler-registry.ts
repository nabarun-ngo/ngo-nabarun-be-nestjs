import { Injectable } from '@nestjs/common';
import {
  IWorkflowTaskHandlerRegistry,
  WorkflowTaskHandler,
} from '../../application/interfaces/workflow-task-handler.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';

@Injectable()
export class WorkflowTaskHandlerRegistry implements IWorkflowTaskHandlerRegistry {
  private readonly handlers = new Map<string, WorkflowTaskHandler>();

  register(name: string, handler: WorkflowTaskHandler): void {
    this.handlers.set(name, handler);
  }

  get(name: string): WorkflowTaskHandler | undefined {
    return this.handlers.get(name);
  }

  async execute(
    name: string,
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const handler = this.get(name);
    if (!handler) {
      throw new BusinessException(`Task handler not found: ${name}`);
    }
    return handler.handle(context, taskConfig);
  }
}
