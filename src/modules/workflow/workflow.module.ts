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
import { JobProcessingModule } from '../shared/job-processing/job-processing.module';
import { UserModule } from '../user/user.module';
import { FirebaseModule } from '../shared/firebase/firebase.module';
import { WorkflowDefService } from './infrastructure/external/workflow-def.service';
import { WorkflowEventsHandler } from './application/handlers/workflow-event.handler';
import { StartWorkflowStepUseCase } from './application/use-cases/start-workflow-step.use-case';
import { AutomaticTaskService } from './application/services/automatic-task.service';
import { ValidateInputsHandler } from './application/automatic-task-handlers/validate-inputs.handler';
import { Auth0UserCreationHandler } from './application/automatic-task-handlers/auth0-user-creation.handler';
import { UserNotRegisteredTaskHandler } from './application/automatic-task-handlers/user-not-registered.handler';
import { GuestDonationCreationHandler } from './application/automatic-task-handlers/guest-donation-creation.handler';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [JobProcessingModule, UserModule, FirebaseModule, FinanceModule],
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
    WorkflowDefService,
    WorkflowEventsHandler,
    StartWorkflowStepUseCase,
    AutomaticTaskService,
    ValidateInputsHandler,
    Auth0UserCreationHandler,
    UserNotRegisteredTaskHandler,
    GuestDonationCreationHandler,
  ],
  exports: [
    WorkflowService,
    WORKFLOW_INSTANCE_REPOSITORY,
  ],
})
export class WorkflowModule { }

