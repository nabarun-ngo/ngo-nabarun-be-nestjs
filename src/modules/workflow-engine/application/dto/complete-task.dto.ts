export class CompleteTaskDto {
  instanceId!: string;
  taskId!: string;
  completedBy!: string;
  remarks?: string;
  resultData?: Record<string, unknown>;
}

export class FailTaskDto {
  instanceId!: string;
  taskId!: string;
  completedBy?: string;
  remarks!: string;
}
