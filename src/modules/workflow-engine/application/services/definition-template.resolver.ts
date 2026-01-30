import Handlebars from 'handlebars';
import {
  EngineWorkflowDefinition,
  StepDef,
  TaskDef,
} from '../../domain/vo/engine-workflow-def.vo';

/**
 * Resolves Handlebars placeholders in definition string fields using instance context.
 * Falls back to raw string on compile/render errors.
 */
export class DefinitionTemplateResolver {
  static resolveString(template: string, context: Record<string, unknown>): string {
    if (!template || typeof template !== 'string') return template;
    if (!template.includes('{{')) return template;
    try {
      const compiled = Handlebars.compile(template);
      return compiled(context) ?? template;
    } catch {
      return template;
    }
  }

  static resolveWorkflowLevel(
    definition: EngineWorkflowDefinition,
    context: Record<string, unknown>,
  ): EngineWorkflowDefinition {
    const ctx = { ...context, requestData: context.requestData ?? context };
    return {
      ...definition,
      name: this.resolveString(definition.name, ctx),
      description: definition.description
        ? this.resolveString(definition.description, ctx)
        : definition.description,
    };
  }

  static resolveStepLevel(
    stepDef: StepDef,
    context: Record<string, unknown>,
  ): StepDef {
    const ctx = { ...context, requestData: context.requestData ?? context };
    return {
      ...stepDef,
      name: this.resolveString(stepDef.name, ctx),
      description: stepDef.description
        ? this.resolveString(stepDef.description, ctx)
        : stepDef.description,
      tasks: stepDef.tasks.map((t) => this.resolveTaskLevel(t, context)),
    };
  }

  static resolveTaskLevel(
    taskDef: TaskDef,
    context: Record<string, unknown>,
  ): TaskDef {
    const ctx = { ...context, requestData: context.requestData ?? context };
    const resolved: TaskDef = {
      ...taskDef,
      name: this.resolveString(taskDef.name, ctx),
      description: taskDef.description
        ? this.resolveString(taskDef.description, ctx)
        : taskDef.description,
    };
    if (taskDef.taskDetail?.checklist?.length) {
      resolved.taskDetail = {
        ...taskDef.taskDetail,
        checklist: taskDef.taskDetail.checklist.map((item) =>
          this.resolveString(item, ctx),
        ),
      };
    }
    return resolved;
  }
}
