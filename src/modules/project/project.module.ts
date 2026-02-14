import { Module } from '@nestjs/common';

// Repositories
import { ProjectRepository } from './infrastructure/persistence/project.repository';
import { PROJECT_REPOSITORY } from './domain/repositories/project.repository.interface';
import { GoalRepository } from './infrastructure/persistence/goal.repository';
import { GOAL_REPOSITORY } from './domain/repositories/goal.repository.interface';
import { ActivityRepository } from './infrastructure/persistence/activity.repository';
import { ACTIVITY_REPOSITORY } from './domain/repositories/activity.repository.interface';
import { MilestoneRepository } from './infrastructure/persistence/milestone.repository';
import { MILESTONE_REPOSITORY } from './domain/repositories/milestone.repository.interface';
import { ProjectTeamMemberRepository } from './infrastructure/persistence/project-team-member.repository';
import { PROJECT_TEAM_MEMBER_REPOSITORY } from './domain/repositories/project-team-member.repository.interface';
import { BeneficiaryRepository } from './infrastructure/persistence/beneficiary.repository';
import { BENEFICIARY_REPOSITORY } from './domain/repositories/beneficiary.repository.interface';
import { ProjectRiskRepository } from './infrastructure/persistence/project-risk.repository';
import { PROJECT_RISK_REPOSITORY } from './domain/repositories/project-risk.repository.interface';

// Use Cases
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { UpdateProjectUseCase } from './application/use-cases/update-project.use-case';
import { CreateGoalUseCase } from './application/use-cases/create-goal.use-case';
import { CreateActivityUseCase } from './application/use-cases/create-activity.use-case';
import { UpdateActivityUseCase } from './application/use-cases/update-activity.use-case';

// Services
import { ProjectService } from './application/services/project.service';

// Controllers
import { ProjectController } from './presentation/controllers/project.controller';
import { FirebaseModule } from '../shared/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [ProjectController],
  providers: [
    // Repositories
    {
      provide: PROJECT_REPOSITORY,
      useClass: ProjectRepository,
    },
    {
      provide: GOAL_REPOSITORY,
      useClass: GoalRepository,
    },
    {
      provide: ACTIVITY_REPOSITORY,
      useClass: ActivityRepository,
    },
    {
      provide: MILESTONE_REPOSITORY,
      useClass: MilestoneRepository,
    },
    {
      provide: PROJECT_TEAM_MEMBER_REPOSITORY,
      useClass: ProjectTeamMemberRepository,
    },
    {
      provide: BENEFICIARY_REPOSITORY,
      useClass: BeneficiaryRepository,
    },
    {
      provide: PROJECT_RISK_REPOSITORY,
      useClass: ProjectRiskRepository,
    },
    // Use Cases
    CreateProjectUseCase,
    UpdateProjectUseCase,
    CreateGoalUseCase,
    CreateActivityUseCase,
    UpdateActivityUseCase,
    // Services
    ProjectService,
  ],
  exports: [ProjectService],
})
export class ProjectModule { }

