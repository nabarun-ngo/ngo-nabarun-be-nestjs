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
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { ApiAutoResponse, ApiAutoPagedResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';
import { StartWorkflowUseCase } from '../../application/use-cases/start-workflow.use-case';
import { CompleteTaskUseCase } from '../../application/use-cases/complete-task.use-case';
import { AcceptAssignmentUseCase } from '../../application/use-cases/accept-assignment.use-case';
import { RejectAssignmentUseCase } from '../../application/use-cases/reject-assignment.use-case';
import { ReassignTaskUseCase } from '../../application/use-cases/reassign-task.use-case';
import { CancelInstanceUseCase } from '../../application/use-cases/cancel-instance.use-case';
import { GetWorkflowInstanceUseCase } from '../../application/use-cases/get-workflow-instance.use-case';
import { ListWorkflowInstancesUseCase } from '../../application/use-cases/list-workflow-instances.use-case';
import { GetOverdueAssignmentsUseCase } from '../../application/use-cases/get-overdue-assignments.use-case';
import { ListWorkflowsForMeUseCase } from '../../application/use-cases/list-workflows-for-me.use-case';
import { ListWorkflowsByMeUseCase } from '../../application/use-cases/list-workflows-by-me.use-case';
import { ListTasksForMeUseCase } from '../../application/use-cases/list-tasks-for-me.use-case';
import { ProcessAutomaticTaskUseCase } from '../../application/use-cases/process-automatic-task.use-case';
import { GetReferenceDataUseCase } from '../../application/use-cases/get-reference-data.use-case';
import { GetAdditionalFieldsUseCase } from '../../application/use-cases/get-additional-fields.use-case';
import {
  EngineStartWorkflowDto as StartWorkflowDto,
  CompleteTaskDto,
  RejectAssignmentDto,
  ReassignTaskDto,
  CancelInstanceDto,
  EngineWorkflowInstanceDto,
  EngineTaskAssignmentDto,
} from '../../application/dto/workflow-engine.dto';
import { WorkflowEngineDtoMapper } from '../../application/dto/workflow-engine-dto.mapper';

@ApiTags('WorkflowEngine')
@ApiBearerAuth('jwt')
@Controller('workflow-engine')
export class WorkflowEngineController {
  constructor(
    private readonly startWorkflowUseCase: StartWorkflowUseCase,
    private readonly completeTaskUseCase: CompleteTaskUseCase,
    private readonly acceptAssignmentUseCase: AcceptAssignmentUseCase,
    private readonly rejectAssignmentUseCase: RejectAssignmentUseCase,
    private readonly reassignTaskUseCase: ReassignTaskUseCase,
    private readonly cancelInstanceUseCase: CancelInstanceUseCase,
    private readonly getWorkflowInstanceUseCase: GetWorkflowInstanceUseCase,
    private readonly listWorkflowInstancesUseCase: ListWorkflowInstancesUseCase,
    private readonly getOverdueAssignmentsUseCase: GetOverdueAssignmentsUseCase,
    private readonly listWorkflowsForMeUseCase: ListWorkflowsForMeUseCase,
    private readonly listWorkflowsByMeUseCase: ListWorkflowsByMeUseCase,
    private readonly listTasksForMeUseCase: ListTasksForMeUseCase,
    private readonly processAutomaticTaskUseCase: ProcessAutomaticTaskUseCase,
    private readonly getReferenceDataUseCase: GetReferenceDataUseCase,
    private readonly getAdditionalFieldsUseCase: GetAdditionalFieldsUseCase,
  ) { }

  @Post('start')
  @ApiOperation({ summary: 'Start a new workflow instance' })
  @ApiAutoResponse(EngineWorkflowInstanceDto, { status: 201 })
  async start(
    @Body() dto: StartWorkflowDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<EngineWorkflowInstanceDto>> {
    const instance = await this.startWorkflowUseCase.execute({
      type: dto.type,
      data: dto.data,
      requestedBy: user?.profile_id ?? dto.requestedBy!,
      requestedFor: dto.requestedFor,
      definitionVersion: dto.definitionVersion,
    });
    return new SuccessResponse(WorkflowEngineDtoMapper.toInstanceDto(instance));
  }

  @Post('instances/:id/tasks/:taskId/complete')
  @ApiOperation({ summary: 'Complete a manual task' })
  @ApiAutoResponse(EngineWorkflowInstanceDto)
  async completeTask(
    @Param('id') instanceId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CompleteTaskDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<EngineWorkflowInstanceDto>> {
    const instance = await this.completeTaskUseCase.execute({
      instanceId,
      taskId,
      completedBy: user?.profile_id ?? dto.completedBy,
      resultData: dto.resultData,
      remarks: dto.remarks,
    });
    return new SuccessResponse(WorkflowEngineDtoMapper.toInstanceDto(instance));
  }

  @Post('instances/:id/tasks/:taskId/assignments/:assignmentId/accept')
  @ApiOperation({ summary: 'Accept an assignment' })
  @ApiAutoResponse(EngineWorkflowInstanceDto)
  async acceptAssignment(
    @Param('id') instanceId: string,
    @Param('taskId') taskId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<EngineWorkflowInstanceDto>> {
    const instance = await this.acceptAssignmentUseCase.execute({
      instanceId,
      taskId,
      assignmentId,
      acceptedBy: user?.profile_id!,
    });
    return new SuccessResponse(WorkflowEngineDtoMapper.toInstanceDto(instance));
  }

  @Post('instances/:id/tasks/:taskId/assignments/:assignmentId/reject')
  @ApiOperation({ summary: 'Reject an assignment' })
  @ApiAutoResponse(EngineWorkflowInstanceDto)
  async rejectAssignment(
    @Param('id') instanceId: string,
    @Param('taskId') taskId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: RejectAssignmentDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<EngineWorkflowInstanceDto>> {
    const instance = await this.rejectAssignmentUseCase.execute({
      instanceId,
      taskId,
      assignmentId,
      rejectedBy: user?.profile_id!,
      rejectionReason: dto.rejectionReason,
    });
    return new SuccessResponse(WorkflowEngineDtoMapper.toInstanceDto(instance));
  }

  @Post('instances/:id/tasks/:taskId/reassign')
  @ApiOperation({ summary: 'Reassign task to another user' })
  @ApiAutoResponse(EngineWorkflowInstanceDto)
  async reassignTask(
    @Param('id') instanceId: string,
    @Param('taskId') taskId: string,
    @Body() dto: ReassignTaskDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<EngineWorkflowInstanceDto>> {
    const instance = await this.reassignTaskUseCase.execute({
      instanceId,
      taskId,
      newAssigneeId: dto.newAssigneeId,
      reassignedBy: user?.profile_id!,
      remarks: dto.remarks,
    });
    return new SuccessResponse(WorkflowEngineDtoMapper.toInstanceDto(instance));
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get workflow instance by ID' })
  @ApiAutoResponse(EngineWorkflowInstanceDto)
  async getInstance(
    @Param('id') id: string,
  ): Promise<SuccessResponse<EngineWorkflowInstanceDto>> {
    const instance = await this.getWorkflowInstanceUseCase.execute(id);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }
    return new SuccessResponse(WorkflowEngineDtoMapper.toInstanceDto(instance));
  }

  @Get('instances')
  @ApiOperation({ summary: 'List workflow instances (paged)' })
  @ApiAutoPagedResponse(EngineWorkflowInstanceDto)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  async listInstances(
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('initiatedById') initiatedById?: string,
    @Query('initiatedForId') initiatedForId?: string,
  ): Promise<SuccessResponse<PagedResult<EngineWorkflowInstanceDto>>> {
    const result = await this.listWorkflowInstancesUseCase.execute({
      type,
      status: status ? [status] : undefined,
      initiatedById,
      initiatedForId,
      pageIndex: page ?? 0,
      pageSize: size ?? 20,
    });
    const dtoResult = new PagedResult<EngineWorkflowInstanceDto>(
      result.content.map((i) => WorkflowEngineDtoMapper.toInstanceDto(i)),
      result.totalSize,
      result.pageIndex,
      result.pageSize,
    );
    return new SuccessResponse(dtoResult);
  }

  @Get('instances/forMe')
  @ApiOperation({ summary: 'List workflows for current user (as beneficiary)' })
  @ApiAutoPagedResponse(EngineWorkflowInstanceDto)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  async listInstancesForMe(
    @CurrentUser() user?: AuthUser,
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ): Promise<SuccessResponse<PagedResult<EngineWorkflowInstanceDto>>> {
    const result = await this.listWorkflowsForMeUseCase.execute({
      userId: user?.profile_id!,
      pageIndex: page ?? 0,
      pageSize: size ?? 20,
      type,
      status,
    });
    const dtoResult = new PagedResult<EngineWorkflowInstanceDto>(
      result.content.map((i) => WorkflowEngineDtoMapper.toInstanceDto(i)),
      result.totalSize,
      result.pageIndex,
      result.pageSize,
    );
    return new SuccessResponse(dtoResult);
  }

  @Get('instances/byMe')
  @ApiOperation({ summary: 'List workflows initiated by current user' })
  @ApiAutoPagedResponse(EngineWorkflowInstanceDto)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  async listInstancesByMe(
    @CurrentUser() user?: AuthUser,
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ): Promise<SuccessResponse<PagedResult<EngineWorkflowInstanceDto>>> {
    const result = await this.listWorkflowsByMeUseCase.execute({
      userId: user?.profile_id!,
      pageIndex: page ?? 0,
      pageSize: size ?? 20,
      type,
      status,
    });
    const dtoResult = new PagedResult<EngineWorkflowInstanceDto>(
      result.content.map((i) => WorkflowEngineDtoMapper.toInstanceDto(i)),
      result.totalSize,
      result.pageIndex,
      result.pageSize,
    );
    return new SuccessResponse(dtoResult);
  }

  @Get('tasks/forMe')
  @ApiOperation({ summary: 'List tasks assigned to current user' })
  @ApiAutoPagedResponse(EngineTaskAssignmentDto)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  @ApiQuery({ name: 'completed', required: false, type: Boolean, description: 'true=completed, false=pending' })
  @ApiQuery({ name: 'type', required: false, description: 'MANUAL or AUTOMATIC' })
  @ApiQuery({ name: 'workflowId', required: false })
  @ApiQuery({ name: 'taskId', required: false })
  async listTasksForMe(
    @CurrentUser() user?: AuthUser,
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('completed') completed?: string,
    @Query('type') type?: string,
    @Query('workflowId') workflowId?: string,
    @Query('taskId') taskId?: string,
  ): Promise<SuccessResponse<PagedResult<EngineTaskAssignmentDto>>> {
    // Parse completed string to boolean
    let completedBool: boolean | undefined;
    if (completed === 'true' || completed === 'Y') completedBool = true;
    else if (completed === 'false' || completed === 'N') completedBool = false;

    const result = await this.listTasksForMeUseCase.execute({
      userId: user?.profile_id!,
      pageIndex: page ?? 0,
      pageSize: size ?? 20,
      completed: completedBool,
      type,
      workflowId,
      taskId,
    });
    const dtoResult = new PagedResult<EngineTaskAssignmentDto>(
      result.content.map((a) => WorkflowEngineDtoMapper.toAssignmentDto(a)),
      result.totalSize,
      result.pageIndex,
      result.pageSize,
    );
    return new SuccessResponse(dtoResult);
  }

  @Get('assignments/overdue')
  @ApiOperation({ summary: 'List overdue assignments (for cron/reminders)' })
  @ApiAutoResponse(EngineTaskAssignmentDto, { isArray: true })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'workflowType', required: false })
  async listOverdueAssignments(
    @Query('assigneeId') assigneeId?: string,
    @Query('workflowType') workflowType?: string,
  ): Promise<SuccessResponse<EngineTaskAssignmentDto[]>> {
    const assignments = await this.getOverdueAssignmentsUseCase.execute({
      assigneeId,
      workflowType,
    });
    const dtos = assignments.map((a) => WorkflowEngineDtoMapper.toAssignmentDto(a));
    return new SuccessResponse(dtos);
  }

  @Post('instances/:id/cancel')
  @ApiOperation({ summary: 'Cancel workflow instance' })
  async cancelInstance(
    @Param('id') id: string,
    @Body() dto: CancelInstanceDto,
  ): Promise<SuccessResponse<void>> {
    await this.cancelInstanceUseCase.execute({ instanceId: id, reason: dto.reason });
    return new SuccessResponse();
  }

  @Post('instances/:id/tasks/:taskId/process')
  @ApiOperation({ summary: 'Manually trigger/process an automatic task (admin only)' })
  @ApiAutoResponse(EngineWorkflowInstanceDto)
  async processAutomaticTask(
    @Param('id') instanceId: string,
    @Param('taskId') taskId: string,
  ): Promise<SuccessResponse<EngineWorkflowInstanceDto>> {
    const instance = await this.processAutomaticTaskUseCase.execute({
      instanceId,
      taskId,
    });
    return new SuccessResponse(WorkflowEngineDtoMapper.toInstanceDto(instance));
  }

  @Get('static/referenceData')
  @ApiOperation({ summary: 'Get workflow reference data (types, statuses, etc.)' })
  async getReferenceData(): Promise<SuccessResponse<any>> {
    const refData = await this.getReferenceDataUseCase.execute();
    return new SuccessResponse(refData);
  }

  @Get('static/additionalFields')
  @ApiOperation({ summary: 'Get additional fields for a workflow type' })
  @ApiQuery({ name: 'workflowType', required: true, description: 'Workflow type' })
  async getAdditionalFields(
    @Query('workflowType') workflowType: string,
  ): Promise<SuccessResponse<any>> {
    const fields = await this.getAdditionalFieldsUseCase.execute({ workflowType });
    return new SuccessResponse(fields);
  }
}
