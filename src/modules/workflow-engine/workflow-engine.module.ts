import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { DatabaseModule } from '../shared/database/database.module';
import { UserModule } from '../user/user.module';
import { FirebaseModule } from '../shared/firebase/firebase.module';
import { WorkflowEngineController } from './presentation/controllers/workflow-engine.controller';
import { StartWorkflowUseCase } from './application/use-cases/start-workflow.use-case';
import { CompleteTaskUseCase } from './application/use-cases/complete-task.use-case';
import { AcceptAssignmentUseCase } from './application/use-cases/accept-assignment.use-case';
import { RejectAssignmentUseCase } from './application/use-cases/reject-assignment.use-case';
import { ReassignTaskUseCase } from './application/use-cases/reassign-task.use-case';
import { CancelInstanceUseCase } from './application/use-cases/cancel-instance.use-case';
import { GetWorkflowInstanceUseCase } from './application/use-cases/get-workflow-instance.use-case';
import { ListWorkflowInstancesUseCase } from './application/use-cases/list-workflow-instances.use-case';
import { GetOverdueAssignmentsUseCase } from './application/use-cases/get-overdue-assignments.use-case';
import { ListWorkflowsForMeUseCase } from './application/use-cases/list-workflows-for-me.use-case';
import { ListWorkflowsByMeUseCase } from './application/use-cases/list-workflows-by-me.use-case';
import { ListTasksForMeUseCase } from './application/use-cases/list-tasks-for-me.use-case';
import { ProcessAutomaticTaskUseCase } from './application/use-cases/process-automatic-task.use-case';
import { GetReferenceDataUseCase } from './application/use-cases/get-reference-data.use-case';
import { GetAdditionalFieldsUseCase } from './application/use-cases/get-additional-fields.use-case';
import { EngineWorkflowRefDataService } from './infrastructure/external/engine-workflow-ref-data.service';
import { RemoteConfigDefinitionSource } from './infrastructure/external/remote-config-definition-source';
import { WorkflowTaskHandlerRegistry } from './infrastructure/handlers/workflow-task-handler-registry';
import { EngineWorkflowInstanceRepository } from './infrastructure/persistence/engine-workflow-instance.repository';
import { WORKFLOW_DEFINITION_SOURCE } from './domain/vo/engine-workflow-def.vo';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from './domain/repositories/engine-workflow-instance.repository.interface';
import { WORKFLOW_TASK_HANDLER_REGISTRY } from './application/interfaces/workflow-task-handler.interface';
import { EngineHandlerRegistrationService } from './infrastructure/handlers/engine-handler-registration.service';
import { ValidateInputsHandler } from './infrastructure/handlers/validate-inputs.handler';
import { Auth0UserCreationHandler } from './infrastructure/handlers/auth0-user-creation.handler';
import { UserNotRegisteredHandler } from './infrastructure/handlers/user-not-registered.handler';
import { EngineWorkflowEventHandler } from './application/handlers/engine-workflow-event.handler';
import { EngineWorkflowJobProcessor } from './application/handlers/engine-workflow-job.processor';

@Module({
  imports: [DiscoveryModule, DatabaseModule, UserModule, FirebaseModule],
  controllers: [WorkflowEngineController],
  providers: [
    // Definition Source
    RemoteConfigDefinitionSource,
    {
      provide: WORKFLOW_DEFINITION_SOURCE,
      useExisting: RemoteConfigDefinitionSource,
    },
    
    // Handler Registry & Handlers
    WorkflowTaskHandlerRegistry,
    {
      provide: WORKFLOW_TASK_HANDLER_REGISTRY,
      useExisting: WorkflowTaskHandlerRegistry,
    },
    ValidateInputsHandler,
    Auth0UserCreationHandler,
    UserNotRegisteredHandler,
    EngineHandlerRegistrationService,
    
    // Repository
    {
      provide: ENGINE_WORKFLOW_INSTANCE_REPOSITORY,
      useClass: EngineWorkflowInstanceRepository,
    },
    
    // Services
    EngineWorkflowRefDataService,
    
    // Use Cases
    StartWorkflowUseCase,
    CompleteTaskUseCase,
    AcceptAssignmentUseCase,
    RejectAssignmentUseCase,
    ReassignTaskUseCase,
    CancelInstanceUseCase,
    GetWorkflowInstanceUseCase,
    ListWorkflowInstancesUseCase,
    GetOverdueAssignmentsUseCase,
    ListWorkflowsForMeUseCase,
    ListWorkflowsByMeUseCase,
    ListTasksForMeUseCase,
    ProcessAutomaticTaskUseCase,
    GetReferenceDataUseCase,
    GetAdditionalFieldsUseCase,
    
    // Event Handlers & Job Processors
    EngineWorkflowEventHandler,
    EngineWorkflowJobProcessor,
  ],
  exports: [
    WORKFLOW_DEFINITION_SOURCE,
    ENGINE_WORKFLOW_INSTANCE_REPOSITORY,
    WORKFLOW_TASK_HANDLER_REGISTRY,
  ],
})
export class WorkflowEngineModule {}
