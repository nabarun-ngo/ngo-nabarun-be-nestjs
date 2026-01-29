export class AcceptAssignmentDto {
  assignmentId!: string;
}

export class RejectAssignmentDto {
  assignmentId!: string;
  rejectionReason?: string;
}

export class ReassignTaskDto {
  instanceId!: string;
  taskId!: string;
  newAssigneeId!: string;
  dueAt?: string; // ISO date
}

export class AssignTaskDto {
  instanceId!: string;
  taskId!: string;
  assigneeId!: string;
  dueAt?: string; // ISO date
}
