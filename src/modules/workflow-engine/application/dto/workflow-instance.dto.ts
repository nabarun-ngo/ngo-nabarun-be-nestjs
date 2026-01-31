export class ListWorkflowInstancesDto {
  type?: string;
  status?: string[];
  initiatedById?: string;
  initiatedForId?: string;
  pageIndex?: number;
  pageSize?: number;
}

export class GetOverdueAssignmentsDto {
  assigneeId?: string;
  workflowType?: string;
}

export class CancelWorkflowDto {
  instanceId!: string;
  reason!: string;
}
