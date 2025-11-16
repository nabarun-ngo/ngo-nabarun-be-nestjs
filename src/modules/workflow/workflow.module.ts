import { Module } from '@nestjs/common';
import { WorkflowController } from './presentation/controllers/workflow.controller';
import { StartWorkflowUseCase } from './application/use-cases/start-workflow.use-case';
import { CompleteTaskUseCase } from './application/use-cases/complete-task.use-case';
import { WorkflowService } from './application/services/workflow.service';
import WorkflowInstanceRepository from './infrastructure/persistence/workflow-instance.repository';
import {
  WORKFLOW_INSTANCE_REPOSITORY,
} from './domain/repositories/workflow-instance.repository.interface';
import { WorkflowJobProcessor } from './application/handlers/workflow-job.processor';
import { WorkflowHandlerRegistry } from './application/handlers/workflow-handler.registry';
import { JobProcessingModule } from '../shared/job-processing/job-processing.module';
import { UserModule } from '../user/user.module';
import { FirebaseModule } from '../shared/firebase/firebase.module';
import { WorkflowDefService } from './infrastructure/external/workflow-def.service';
import { WorkflowEventsHandler } from './application/handlers/workflow-event.handler';
import { StartWorkflowStepUseCase } from './application/use-cases/start-workflow-step.use-case';

@Module({
  imports: [JobProcessingModule, UserModule,FirebaseModule],
  controllers: [WorkflowController],
  providers: [
    StartWorkflowUseCase,
    CompleteTaskUseCase,
    WorkflowService,
    {
      provide: WORKFLOW_INSTANCE_REPOSITORY,
      useClass: WorkflowInstanceRepository,
    },
    WorkflowJobProcessor,
    WorkflowHandlerRegistry,
    WorkflowDefService,
    WorkflowEventsHandler,
    StartWorkflowStepUseCase
  ],
  exports: [
    WorkflowService,
    WORKFLOW_INSTANCE_REPOSITORY,
  ],
})
export class WorkflowModule {}

