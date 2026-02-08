import { Injectable } from "@nestjs/common";
import { WorkflowTask } from "../../domain/model/workflow-task.model";
import { TaskDef, WorkflowDefinition } from "../../domain/vo/workflow-def.vo";
import { IAutomaticTaskHandler } from "./automatic-task-handler.interface";
import { DonationFormDto } from "src/modules/public/application/dto/public.dto";
import { CreateDonationUseCase } from "src/modules/finance/application/use-cases/create-donation.use-case";
import { DonationType } from "src/modules/finance/domain/model/donation.model";

@Injectable()
export class GuestDonationCreationHandler implements IAutomaticTaskHandler {
    handlerName = GuestDonationCreationHandler.name;

    constructor(
        private readonly createDonationUseCase: CreateDonationUseCase,
    ) { }

    async handle(task: WorkflowTask | TaskDef, requestData?: Record<string, any>, definition?: WorkflowDefinition): Promise<void> {
        const data = requestData as DonationFormDto;
        const donation = await this.createDonationUseCase.execute({
            amount: data.amount,
            type: DonationType.ONETIME,
            isGuest: true,
            donorEmail: data.email,
            donorName: data.fullName,
            donorNumber: data.contactNumber
        });
        const taskk = task as WorkflowTask;
        taskk.resultData = {
            donationId: donation.id
        }
    }
}
