import { Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProjectService } from '../../application/services/project.service';
import { CreateProjectDto, UpdateProjectDto, ProjectDetailDto, ProjectDetailFilterDto } from '../../application/dto/project.dto';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';

@ApiTags('Project')
@Controller('api/project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully', type: ProjectDetailDto })
  async create(@Body() dto: CreateProjectDto): Promise<ProjectDetailDto> {
    return await this.projectService.create(dto);
  }

  @Patch(':id/update')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully', type: ProjectDetailDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto): Promise<ProjectDetailDto> {
    return await this.projectService.update(id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully', type: ProjectDetailDto })
  async getById(@Param('id') id: string): Promise<ProjectDetailDto> {
    return await this.projectService.getById(id);
  }

  @Get('list')
  @ApiOperation({ summary: 'List projects with filters and pagination' })
  @ApiQuery({ name: 'pageIndex', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully', type: [ProjectDetailDto] })
  async list(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: ProjectDetailFilterDto,
  ): Promise<PagedResult<ProjectDetailDto>> {
    const baseFilter: BaseFilter<ProjectDetailFilterDto> = {
      pageIndex: pageIndex ? Number(pageIndex) : 0,
      pageSize: pageSize ? Number(pageSize) : 10,
      props: filter,
    };
    return await this.projectService.list(baseFilter);
  }
}

