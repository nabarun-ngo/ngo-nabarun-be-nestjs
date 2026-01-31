export interface WorkflowTaskHandler {
  handle(
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}

export interface IWorkflowTaskHandlerRegistry {
  register(name: string, handler: WorkflowTaskHandler): void;
  get(name: string): WorkflowTaskHandler | undefined;
  execute(
    name: string,
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}

export const WORKFLOW_TASK_HANDLER_REGISTRY = Symbol(
  'WORKFLOW_TASK_HANDLER_REGISTRY',
);
