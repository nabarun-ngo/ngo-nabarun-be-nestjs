import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SuccessResponse } from '../../../../shared/models/response-model';
import { FieldAttributeDto, StartWorkflowDto, UpdateTaskDto, WorkflowInstanceDto, WorkflowRefDataDto, WorkflowTaskDto } from '../../application/dto/workflow.dto';
import { WorkflowService } from '../../application/services/workflow.service';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import { type AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';
import { PagedResult } from 'src/shared/models/paged-result';
import { RequireAllPermissions } from 'src/modules/shared/auth/application/decorators/require-permissions.decorator';
import { ApiAutoResponse, ApiAutoPagedResponse, ApiAutoPrimitiveResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { WorkflowType } from '../../domain/model/workflow-instance.model';
import { WorkflowTask, WorkflowTaskStatus, WorkflowTaskType } from '../../domain/model/workflow-task.model';

@ApiTags(WorkflowController.name)
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
  @Get(':id/instance')
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
  @ApiAutoPagedResponse(WorkflowInstanceDto, { description: 'Workflow instances retrieved successfully', wrapInSuccessResponse: true })
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
  @ApiQuery({ name: 'delegated', required: false, type: Boolean, description: 'Filter by delegated (set true to get workflow created by me for others, set false to get only workflow created by me for me)' })
  async listInstancesByMe(
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('delegated') delegated?: boolean,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<PagedResult<WorkflowInstanceDto>>> {
    const instances =
      await this.workflowService.getWorkflows({
        pageIndex: page,
        pageSize: size,
        props: {
          initiatedBy: user?.profile_id,
          delegated: delegated,
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
  @ApiQuery({ name: 'completed', required: true, type: Boolean, description: 'Filter by completed (set true to get completed tasks, set false to get pending tasks)' })
  async listTasks(
    @Query('completed') completed: boolean,
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
          status: completed ? WorkflowTask.completedTaskStatus : WorkflowTask.pendingTaskStatus,
        }
      })
    return new SuccessResponse<PagedResult<WorkflowTaskDto>>(instances);
  }

  @RequireAllPermissions('read:work')
  @Get('tasks/automatic')
  @ApiOperation({ summary: 'List automatic workflow tasks' })
  @ApiAutoPagedResponse(WorkflowTaskDto, { description: 'Workflow tasks retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Index of the page to retrieve' })
  @ApiQuery({ name: 'size', required: false, type: Number, description: 'Count of content to load per page' })
  async listAutomaticTasks(
    @Query('page') page?: number,
    @Query('size') size?: number,
  ): Promise<SuccessResponse<PagedResult<WorkflowTaskDto>>> {
    const instances =
      await this.workflowService.getWorkflowTasks({
        pageIndex: page,
        pageSize: size,
        props: {
          type: WorkflowTaskType.AUTOMATIC,
        }
      })
    return new SuccessResponse<PagedResult<WorkflowTaskDto>>(instances);
  }

  @Post(':id/tasks/:taskId/processTask')
  @ApiOperation({ summary: 'Process a workflow task' })
  @ApiAutoPrimitiveResponse('string', { description: 'Task processed successfully' })
  async processTask(@Param('id') id: string,
    @Param('taskId') taskId: string): Promise<SuccessResponse<WorkflowTaskDto>> {
    return new SuccessResponse<WorkflowTaskDto>(
      await this.workflowService.processAutomaticTask(id, taskId)
    );
  }

  @Get('static/referenceData')
  @ApiOperation({ summary: 'Get static reference data' })
  @ApiAutoResponse(WorkflowRefDataDto, { description: 'Static reference data retrieved successfully' })
  async workflowReferenceData(): Promise<SuccessResponse<WorkflowRefDataDto>> {
    return new SuccessResponse<WorkflowRefDataDto>(
      await this.workflowService.getWorkflowRefData()
    );
  }

  @Get('static/additionalFields')
  @ApiOperation({ summary: 'Get additional fields for a workflow type' })
  @ApiAutoResponse(FieldAttributeDto, { description: 'Additional fields retrieved successfully', wrapInSuccessResponse: true, isArray: true })
  @ApiQuery({ name: 'workflowType', required: true, enum: WorkflowType, description: 'Workflow type' })
  async additionalFields(
    @Query('workflowType') type: WorkflowType,
  ): Promise<SuccessResponse<FieldAttributeDto[]>> {
    return new SuccessResponse<FieldAttributeDto[]>(
      await this.workflowService.getAdditionalFields(type)
    );
  }

}

