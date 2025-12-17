import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Project, ProjectFilterProps } from '../../domain/model/project.model';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository.interface';
import type { IProjectRepository } from '../../domain/repositories/project.repository.interface';
import { BaseFilter } from '../../../../shared/models/base-filter-props';
import { PagedResult } from '../../../../shared/models/paged-result';
import { ProjectDetailFilterDto } from '../dto/project.dto';

@Injectable()
export class ListProjectsUseCase implements IUseCase<BaseFilter<ProjectDetailFilterDto>, PagedResult<Project>> {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) { }

  async execute(filter: BaseFilter<ProjectDetailFilterDto>): Promise<PagedResult<Project>> {
    const filterProps: ProjectFilterProps = {
      status: filter.props?.status,
      category: filter.props?.category,
      phase: filter.props?.phase,
      managerId: filter.props?.managerId,
      sponsorId: filter.props?.sponsorId,
      location: filter.props?.location,
      tags: filter.props?.tags,
    };

    const result = await this.projectRepository.findPaged(filter);
    return new PagedResult(
      result.content,
      result.totalSize,
      filter.pageIndex!,
      filter.pageSize!,
    );
  }
}

