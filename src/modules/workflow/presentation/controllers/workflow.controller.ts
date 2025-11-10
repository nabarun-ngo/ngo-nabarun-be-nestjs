import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SuccessResponse } from '../../../../shared/models/response-model';
import { UseApiKey } from 'src/modules/shared/auth/application/decorators/use-api-key.decorator';
import { StartWorkflowUseCase } from '../../application/use-cases/start-workflow.use-case';
import { CompleteTaskUseCase } from '../../application/use-cases/complete-task.use-case';
import { StartWorkflowDto, WorkflowInstanceDto } from '../../application/dto/start-workflow.dto';
import { CompleteTaskDto } from '../../application/dto/complete-task.dto';
import { CreateWorkflowDefinitionDto } from '../../application/dto/create-workflow-definition.dto';
import { WorkflowStepHistoryDto } from '../../application/dto/step-history.dto';
import { Inject } from '@nestjs/common';
import { WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowService } from '../../application/services/workflow.service';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowDtoMapper } from '../WorkflowDtoMapper';

@ApiTags('Workflows')
@ApiSecurity('api-key')
@ApiBearerAuth('jwt')
@Controller('workflows')
@UseApiKey()
export class WorkflowController {
  constructor(
    private readonly startWorkflowUseCase: StartWorkflowUseCase,
    private readonly completeTaskUseCase: CompleteTaskUseCase,
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IWorkflowInstanceRepository,
    private readonly workflowService: WorkflowService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new workflow instance' })
  @ApiResponse({
    status: 201,
    description: 'Workflow started successfully',
    type: SuccessResponse<WorkflowInstanceDto>,
  })
  async startWorkflow(@Body() dto: StartWorkflowDto): Promise<SuccessResponse<WorkflowInstanceDto>> {
    const result = await this.startWorkflowUseCase.execute(dto);
    return new SuccessResponse<WorkflowInstanceDto>(result);
  }

  @Post('tasks/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a workflow task' })
  @ApiResponse({
    status: 200,
    description: 'Task completed successfully',
    type: SuccessResponse<WorkflowInstanceDto>,
  })
  async completeTask(@Body() dto: CompleteTaskDto): Promise<SuccessResponse<WorkflowInstanceDto>> {
    const result = await this.completeTaskUseCase.execute(dto);
    return new SuccessResponse<WorkflowInstanceDto>(result);
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get workflow instance by ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow instance retrieved successfully',
    type: SuccessResponse<WorkflowInstanceDto>,
  })
  async getInstance(@Param('id') id: string): Promise<SuccessResponse<WorkflowInstanceDto>> {
    const instance = await this.instanceRepository.findById(id, true);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }
    return new SuccessResponse<WorkflowInstanceDto>(
      WorkflowDtoMapper.toDto(instance),
    );
  }

  @Get('instances')
  @ApiOperation({ summary: 'List workflow instances' })
  @ApiResponse({
    status: 200,
    description: 'Workflow instances retrieved successfully',
    type: SuccessResponse<WorkflowInstanceDto[]>,
  })
  async listInstances(
    @Param('type') type?: string,
    @Param('status') status?: string,
  ): Promise<SuccessResponse<WorkflowInstanceDto[]>> {
    let instances;
    if (type) {
      instances = await this.instanceRepository.findByType(type, status);
    } else if (status) {
      instances = await this.instanceRepository.findByStatus(status);
    } else {
      // Return empty for now - in production, you'd have a findAll method
      instances = [];
    }

    return new SuccessResponse<WorkflowInstanceDto[]>(
      instances.map((inst) => WorkflowDtoMapper.toDto(inst)),
    );
  }

  @Get('instances/:id/history')
  @ApiOperation({ summary: 'Get workflow step history' })
  @ApiResponse({
    status: 200,
    description: 'Step history retrieved successfully',
    type: SuccessResponse<WorkflowStepHistoryDto>,
  })
  async getStepHistory(@Param('id') id: string): Promise<SuccessResponse<WorkflowStepHistoryDto>> {
    const history = await this.workflowService.getStepHistory(id);
    return new SuccessResponse<WorkflowStepHistoryDto>(history);
  }

  @Post('definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a workflow definition' })
  @ApiResponse({
    status: 201,
    description: 'Workflow definition created successfully',
  })
  async createDefinition(@Body() dto: CreateWorkflowDefinitionDto) {
    // This would be implemented in a use case
    // For now, just a placeholder
    throw new Error('Not implemented');
  }
} 

