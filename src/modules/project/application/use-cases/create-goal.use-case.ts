import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Goal } from '../../domain/model/goal.model';
import { GOAL_REPOSITORY } from '../../domain/repositories/goal.repository.interface';
import type { IGoalRepository } from '../../domain/repositories/goal.repository.interface';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository.interface';
import type { IProjectRepository } from '../../domain/repositories/project.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateGoalDto } from '../dto/goal.dto';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

@Injectable()
export class CreateGoalUseCase implements IUseCase<CreateGoalDto, Goal> {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IGoalRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateGoalDto): Promise<Goal> {
    // Verify project exists and is active
    const project = await this.projectRepository.findById(request.projectId);
    if (!project) {
      throw new BusinessException('Project not found');
    }
    if (!project.isActive()) {
      throw new BusinessException('Cannot add goal to inactive project');
    }

    // Create domain entity
    const goal = Goal.create({
      projectId: request.projectId,
      title: request.title,
      description: request.description,
      targetValue: request.targetValue,
      targetUnit: request.targetUnit,
      deadline: request.deadline,
      priority: request.priority,
      weight: request.weight,
      dependencies: request.dependencies,
    });

    // Save to repository
    const savedGoal = await this.goalRepository.create(goal);

    // Emit domain events
    for (const event of savedGoal.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    savedGoal.clearEvents();

    return savedGoal;
  }
}

