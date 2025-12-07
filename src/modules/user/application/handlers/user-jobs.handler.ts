import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { JobName, ProcessJob } from "src/modules/shared/job-processing/decorators/process-job.decorator";
import { Role } from "../../domain/model/role.model";
import { AssignRoleUseCase } from "../use-cases/assign-role.use-case";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class UserJobsHandler {

  constructor(
    private readonly assignRoleUseCase: AssignRoleUseCase,

  ) { }


  @ProcessJob({
    name: JobName.UPDATE_USER_ROLE
  })
  async updateUserRole(job: Job<{ userId: string; newRoles: Role[]; }>) {
    await this.assignRoleUseCase.execute({
      userId: job.data.userId,
      newRoles: []
    });
  }


}

