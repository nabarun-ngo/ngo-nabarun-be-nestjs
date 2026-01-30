import { Inject, Injectable } from "@nestjs/common";
import { UserStatus } from "src/modules/user/domain/model/user.model";
import { dtoToRecord, toTeamMemberDTO } from "../dto/public-dto.mapper";
import { WorkflowService } from "src/modules/workflow/application/services/workflow.service";
import { ContactFormDto, DonationFormDto, SignUpDto, TeamMember } from "../dto/public.dto";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { USER_REPOSITORY, type IUserRepository } from "src/modules/user/domain/repositories/user.repository.interface";

@Injectable()
export class PublicService {

    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly workflowService: WorkflowService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async getTeamMembers() {
        const cached = await this.cacheManager.get<TeamMember[]>('team-members');
        if (!cached) {
            const users = (await this.userRepository.findAll({
                public: true,
                status: UserStatus.ACTIVE,
                includeLinks: true,
            })).map(toTeamMemberDTO);
            await this.cacheManager.set('team-members', users);
            return users;
        } else {
            return cached;
        }
    }


    async contactUs(dto: ContactFormDto) {
        const workflow = await this.workflowService.createWorkflow({
            type: "CONTACT_REQUEST",
            data: dtoToRecord(dto),
            forExternalUser: true,
            externalUserEmail: dto.email
        })
        return workflow.id;
    }


    async signUp(dto: SignUpDto) {
        const workflow = await this.workflowService.createWorkflow({
            type: "JOIN_REQUEST",
            data: dtoToRecord(dto),
            forExternalUser: true,
            externalUserEmail: dto.email
        })
        return workflow.id;
    }


    async donate(dto: DonationFormDto) {
        const workflow = await this.workflowService.createWorkflow({
            type: "DONATION_REQUEST",
            data: dtoToRecord(dto),
            forExternalUser: true,
            externalUserEmail: dto.email
        })

        return workflow.id;
    }



}