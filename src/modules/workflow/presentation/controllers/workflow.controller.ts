import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuccessResponse } from '../../../../shared/models/response-model';
import { StartWorkflowDto, UpdateTaskDto, WorkflowInstanceDto, WorkflowTaskDto } from '../../application/dto/workflow.dto';
import { WorkflowService } from '../../application/services/workflow.service';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import { type AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';
import { PagedResult } from 'src/shared/models/paged-result';
import { TaskAssignmentStatus } from '../../domain/model/task-assignment.model';

@ApiTags('Workflows')
@ApiBearerAuth('jwt')
@Controller('workflows')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
  ) { }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new workflow instance' })
  @ApiResponse({
    status: 201,
    description: 'Workflow started successfully',
    type: SuccessResponse<WorkflowInstanceDto>,
  })
  async startWorkflow(@Body() dto: StartWorkflowDto, @CurrentUser() user: AuthUser): Promise<SuccessResponse<WorkflowInstanceDto>> {
    const result = await this.workflowService.createWorkflow(dto, user);
    return new SuccessResponse<WorkflowInstanceDto>(result);
  }



  @Post('tasks/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a workflow task' })
  @ApiResponse({
    status: 200,
    description: 'Task updated successfully',
    type: SuccessResponse<WorkflowTaskDto>,
  })
  async updateTask(@Body() dto: UpdateTaskDto, @CurrentUser() user: AuthUser): Promise<SuccessResponse<WorkflowTaskDto>> {
    const result = await this.workflowService.updateTask(dto,user);
    return new SuccessResponse<WorkflowTaskDto>(result);
  }

  @Get('instance/:id')
  @ApiOperation({ summary: 'Get workflow instance by ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow instance retrieved successfully',
    type: SuccessResponse<WorkflowInstanceDto>,
  })
  async getInstance(@Param('id') id: string): Promise<SuccessResponse<WorkflowInstanceDto>> {
    const instance = await this.workflowService.getWorkflow(id, true);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }
    return new SuccessResponse<WorkflowInstanceDto>(instance);
  }

  @Get('instances/forMe')
  @ApiOperation({ summary: 'List workflow instances' })
  @ApiResponse({
    status: 200,
    description: 'Workflow instances retrieved successfully',
    type: SuccessResponse<PagedResult<WorkflowInstanceDto>>,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Index of the page to retrieve' })
  @ApiQuery({ name: 'size', required: false, type: Number, description: 'Count of content to load per page' })
  async listInstancesForMe(
    @Query('page') page?: number,
    @Query('size') size?: number,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<PagedResult<WorkflowInstanceDto>>> {
    const instances =
      await this.workflowService.getWorkflows({
        pageIndex: page,
        pageSize: size,
        props: {
          initiatedFor: user?.profile_id,
        }
      })
    return new SuccessResponse<PagedResult<WorkflowInstanceDto>>(instances);
  }

  @Get('instances/byMe')
  @ApiOperation({ summary: 'List workflow instances' })
  @ApiResponse({
    status: 200,
    description: 'Workflow instances retrieved successfully',
    type: SuccessResponse<PagedResult<WorkflowInstanceDto>>,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Index of the page to retrieve' })
  @ApiQuery({ name: 'size', required: false, type: Number, description: 'Count of content to load per page' })
  async listInstancesByMe(
    @Query('page') page?: number,
    @Query('size') size?: number,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<PagedResult<WorkflowInstanceDto>>> {
    const instances =
      await this.workflowService.getWorkflows({
        pageIndex: page,
        pageSize: size,
        props: {
          initiatedBy: user?.profile_id,
        }
      })
    return new SuccessResponse<PagedResult<WorkflowInstanceDto>>(instances);
  }

  @Get('tasks/forMe')
  @ApiOperation({ summary: 'List workflow instances' })
  @ApiResponse({
    status: 200,
    description: 'Workflow instances retrieved successfully',
    type: SuccessResponse<PagedResult<WorkflowTaskDto>>,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Index of the page to retrieve' })
  @ApiQuery({ name: 'size', required: false, type: Number, description: 'Count of content to load per page' })
  async listTasks(
    @Query('page') page?: number,
    @Query('size') size?: number,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<PagedResult<WorkflowTaskDto>>> {
    const instances =
      await this.workflowService.getWorkflowTasks({
        pageIndex: page,
        pageSize: size,
        props: {
          assignedTo: user?.profile_id,
          status: [TaskAssignmentStatus.PENDING, TaskAssignmentStatus.ACCEPTED]
        }
      })
    return new SuccessResponse<PagedResult<WorkflowTaskDto>>(instances);
  }

}

