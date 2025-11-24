import { Inject, Injectable } from "@nestjs/common";
import { UserService } from "src/modules/user/application/services/user.service";
import { UserStatus } from "src/modules/user/domain/model/user.model";
import { dtoToRecord, toTeamMemberDTO } from "../dto/public-dto.mapper";
import { WorkflowService } from "src/modules/workflow/application/services/workflow.service";
import { ContactFormDto, DonationFormDto, SignUpDto, TeamMember } from "../dto/public.dto";
import { WorkflowType } from "src/modules/workflow/domain/model/workflow-instance.model";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

@Injectable()
export class PublicService {

    constructor(
        private readonly userService: UserService,
        private readonly workflowService: WorkflowService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async getTeamMembers() {
        const cached = await this.cacheManager.get<TeamMember[]>('team-members');
        if (!cached) {
            const users = (await this.userService.list({
                props: {
                    public: true,
                    status: UserStatus.ACTIVE
                },
            })).items.map(toTeamMemberDTO);
            await this.cacheManager.set('team-members', users);
            return users;
        } else {
            return cached;
        }
    }


    async contactUs(dto: ContactFormDto) {
        const workflow = await this.workflowService.createWorkflow({
            type: WorkflowType.CONTACT_REQUEST,
            data: dtoToRecord(dto)
        })
        return workflow.id;
    }


    async signUp(dto: SignUpDto) {
        const workflow = await this.workflowService.createWorkflow({
            type: WorkflowType.JOIN_REQUEST,
            data: dtoToRecord(dto)
        })
        return workflow.id;
    }


    async donate(dto: DonationFormDto) {
        const workflow = await this.workflowService.createWorkflow({
            type: WorkflowType.DONATION_REQUEST,
            data: dtoToRecord(dto)
        })

        return workflow.id;
    }



}