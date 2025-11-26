import { Injectable } from '@nestjs/common';
import { ProjectDetailDto, CreateProjectDto, UpdateProjectDto, ProjectDetailFilterDto } from '../dto/project.dto';
import { ProjectDtoMapper } from '../dto/project-dto.mapper';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateProjectUseCase } from '../use-cases/create-project.use-case';
import { UpdateProjectUseCase } from '../use-cases/update-project.use-case';
import { GetProjectUseCase } from '../use-cases/get-project.use-case';
import { ListProjectsUseCase } from '../use-cases/list-projects.use-case';

@Injectable()
export class ProjectService {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
    private readonly listProjectsUseCase: ListProjectsUseCase,
  ) {}

  async list(filter: BaseFilter<ProjectDetailFilterDto>): Promise<PagedResult<ProjectDetailDto>> {
    const result = await this.listProjectsUseCase.execute(filter);
    return new PagedResult(
      result.items.map(p => ProjectDtoMapper.toDto(p)),
      result.total,
      result.page,
      result.size,
    );
  }

  async getById(id: string): Promise<ProjectDetailDto> {
    const project = await this.getProjectUseCase.execute(id);
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
}

