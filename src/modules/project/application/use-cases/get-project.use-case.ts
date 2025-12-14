import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Project } from '../../domain/model/project.model';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository.interface';
import type { IProjectRepository } from '../../domain/repositories/project.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

@Injectable()
export class GetProjectUseCase implements IUseCase<string, Project> {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

  async execute(id: string): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new BusinessException('Project not found');
    }
    return project;
  }
}

