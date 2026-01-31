export class StartWorkflowDto {
  type!: string;
  requestedBy!: string;
  requestedFor?: string;
  data!: Record<string, unknown>;
}
