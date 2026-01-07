import { Inject, Injectable } from '@nestjs/common';
import { ProjectDetailDto, CreateProjectDto, UpdateProjectDto, ProjectDetailFilterDto } from '../dto/project.dto';
import { ActivityDtoMapper, ProjectDtoMapper } from '../dto/project-dto.mapper';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateProjectUseCase } from '../use-cases/create-project.use-case';
import { UpdateProjectUseCase } from '../use-cases/update-project.use-case';
import { ACTIVITY_REPOSITORY, type IActivityRepository } from '../../domain/repositories/activity.repository.interface';
import { PROJECT_REPOSITORY, type IProjectRepository } from '../../domain/repositories/project.repository.interface';
import { ActivityDetailDto, ActivityDetailFilterDto, CreateActivityDto } from '../dto/activity.dto';
import { CreateActivityUseCase } from '../use-cases/create-activity.use-case';
import { BusinessException } from 'src/shared/exceptions/business-exception';

@Injectable()
export class ProjectService {


  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly createActivityUseCase: CreateActivityUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepository: IActivityRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) { }

  async list(filter: BaseFilter<ProjectDetailFilterDto>): Promise<PagedResult<ProjectDetailDto>> {
    const result = await this.projectRepository.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: filter.props,
    });
    return new PagedResult(
      result.content.map(p => ProjectDtoMapper.toDto(p)),
      result.totalSize,
      result.pageIndex,
      result.pageSize,
    );
  }

  async getById(id: string): Promise<ProjectDetailDto> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new BusinessException('Project not found with id ' + id);
    }
    return ProjectDtoMapper.toDto(project);
  }

  async create(dto: CreateProjectDto): Promise<ProjectDetailDto> {
    const project = await this.createProjectUseCase.execute(dto);
    return ProjectDtoMapper.toDto(project);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectDetailDto> {
    const project = await this.updateProjectUseCase.execute({ id, data: dto });
    return ProjectDtoMapper.toDto(project);
  }

  async activityList(projectid: string, baseFilter: BaseFilter<ActivityDetailFilterDto>): Promise<PagedResult<ActivityDetailDto>> {
    const result = await this.activityRepository.findPaged({
      pageIndex: baseFilter.pageIndex,
      pageSize: baseFilter.pageSize,
      props: {
        ...baseFilter.props,
        projectId: projectid,
      },
    });
    return new PagedResult(
      result.content.map(p => ActivityDtoMapper.toDto(p)),
      result.totalSize,
      result.pageIndex,
      result.pageSize,
    );
  }

  async createActivity(id: string, dto: CreateActivityDto): Promise<any> {
    const activity = await this.createActivityUseCase.execute({ ...dto, projectId: id });
    return ActivityDtoMapper.toDto(activity);
  }
}

