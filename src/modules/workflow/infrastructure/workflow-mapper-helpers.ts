import { WorkflowPersistence } from './types/workflow-persistence.types';

/**
 * Type-safe helper functions specifically for Workflow aggregate mapping
 * All methods maintain full type safety by using explicit Prisma types
 */
export class WorkflowMapperHelpers {
  /**
   * Extract workflow steps from instance model with type safety
   * Handles both Full and WithOnlySteps types correctly
   */
  static extractSteps(
    model: WorkflowPersistence.Full | WorkflowPersistence.WithOnlySteps,
  ): NonNullable<WorkflowPersistence.WithOnlySteps['steps']> {
    return model.steps ?? [];
  }

  /**
   * Extract sorted steps in deterministic order by orderIndex
   */
  static extractSortedSteps(
    model: WorkflowPersistence.Full | WorkflowPersistence.WithOnlySteps,
  ): NonNullable<WorkflowPersistence.WithOnlySteps['steps']> {
    const steps = this.extractSteps(model);
    return steps.slice().sort((a, b) => a.orderIndex - b.orderIndex);
  }

  /**
   * Extract initiatedBy user from workflow instance
   */
  static extractInitiatedBy(
    model: WorkflowPersistence.Full | WorkflowPersistence.WithOnlySteps,
  ): NonNullable<WorkflowPersistence.Full['initiatedBy']> | null {
    return 'initiatedBy' in model ? model.initiatedBy : null;
  }

  /**
   * Extract initiatedFor user from workflow instance
   */
  static extractInitiatedFor(
    model: WorkflowPersistence.Full | WorkflowPersistence.WithOnlySteps,
  ): NonNullable<WorkflowPersistence.Full['initiatedFor']> | null {
    return 'initiatedFor' in model ? model.initiatedFor : null;
  }

  /**
   * Type-safe check if model has full relations including tasks
   */
  static hasFullRelations(
    model: WorkflowPersistence.Full | WorkflowPersistence.WithOnlySteps,
  ): model is WorkflowPersistence.Full {
    return (
      'steps' in model &&
      Array.isArray(model.steps) &&
      model.steps.length > 0 &&
      'tasks' in model.steps[0]
    );
  }

  /**
   * Type-safe check if model has only steps (no nested tasks)
   */
  static hasOnlySteps(
    model: WorkflowPersistence.Full | WorkflowPersistence.WithOnlySteps,
  ): model is WorkflowPersistence.WithOnlySteps {
    return (
      'steps' in model &&
      (!Array.isArray(model.steps) ||
        model.steps.length === 0 ||
        !('tasks' in model.steps[0]))
    );
  }
}
