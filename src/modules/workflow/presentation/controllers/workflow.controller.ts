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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SuccessResponse } from '../../../../shared/models/response-model';
import { StartWorkflowDto, UpdateTaskDto, WorkflowInstanceDto, WorkflowTaskDto } from '../../application/dto/workflow.dto';
import { WorkflowService } from '../../application/services/workflow.service';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import { type AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';
import { PagedResult } from 'src/shared/models/paged-result';
import { TaskAssignmentStatus } from '../../domain/model/task-assignment.model';
import { RequireAllPermissions } from 'src/modules/shared/auth/application/decorators/require-permissions.decorator';
import { ApiAutoResponse, ApiAutoPagedResponse } from 'src/shared/decorators/api-auto-response.decorator';

@ApiTags('Workflows')
@ApiBearerAuth('jwt')
@Controller('workflows')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
  ) { }

  @RequireAllPermissions('create:request')
  @Post('create')
  @ApiOperation({ summary: 'Start a new workflow instance' })
  @ApiAutoResponse(WorkflowInstanceDto, { status: 201, description: 'Workflow started successfully' })
  async startWorkflow(@Body() dto: StartWorkflowDto, @CurrentUser() user: AuthUser): Promise<SuccessResponse<WorkflowInstanceDto>> {
    const result = await this.workflowService.createWorkflow(dto, user);
    return new SuccessResponse<WorkflowInstanceDto>(result);
  }


  @RequireAllPermissions('update:work')
  @Post(':id/tasks/:taskId/update')
  @ApiOperation({ summary: 'Update a workflow task' })
  @ApiAutoResponse(WorkflowTaskDto, { description: 'Task updated successfully' })
  async updateTask(@Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto, @CurrentUser() user: AuthUser): Promise<SuccessResponse<WorkflowTaskDto>> {
    const result = await this.workflowService.updateTask(id, taskId, dto, user);
    return new SuccessResponse<WorkflowTaskDto>(result);
  }

  
  @RequireAllPermissions('read:request')
  @Get(':id/instances')
  @ApiOperation({ summary: 'Get workflow instance by ID' })
  @ApiAutoResponse(WorkflowInstanceDto, { description: 'Workflow instance retrieved successfully' })
  async getInstance(@Param('id') id: string): Promise<SuccessResponse<WorkflowInstanceDto>> {
    const instance = await this.workflowService.getWorkflow(id, true);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }
    return new SuccessResponse<WorkflowInstanceDto>(instance);
  }

  @RequireAllPermissions('read:request')                                                                                                                                  
  @Get('instances/forMe')
  @ApiOperation({ summary: 'List workflow instances' })
  @ApiAutoPagedResponse(WorkflowInstanceDto, { description: 'Workflow instances retrieved successfully' })
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

  @RequireAllPermissions('read:request')
  @Get('instances/byMe')
  @ApiOperation({ summary: 'List workflow instances' })
  @ApiAutoPagedResponse(WorkflowInstanceDto, { description: 'Workflow instances retrieved successfully' })
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

  @RequireAllPermissions('read:work')
  @Get('tasks/forMe')
  @ApiOperation({ summary: 'List workflow tasks' })
  @ApiAutoPagedResponse(WorkflowTaskDto, { description: 'Workflow tasks retrieved successfully' })
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

