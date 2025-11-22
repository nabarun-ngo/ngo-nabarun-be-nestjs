import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "src/modules/shared/auth/application/decorators/public.decorator";
import { ContactFormDto, DonationFormDto, dtoToRecord, SignUpDto } from "../../application/dto/public.dto";
import { WorkflowService } from "../../application/services/workflow.service";
import { WorkflowType } from "../../domain/model/workflow-instance.model";
import { IgnoreCaptchaValidation } from "src/modules/shared/auth/application/decorators/ignore-captcha.decorator";

@ApiTags('Public')
@Controller('public')
@Public()
export class PublicController {

    constructor(private readonly workflowService: WorkflowService) { }

    @Post('contact')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'contactUs' })
    async contactUs(@Body() dto: ContactFormDto) {
        const workflow = await this.workflowService.createWorkflow({
            type: WorkflowType.CONTACT_REQUEST,
            data: dtoToRecord(dto)
        })
        return {
            id: workflow.id,
            success: true
        }
    }


    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Signup' })
    async signUp(@Body() dto: SignUpDto) {
        const workflow = await this.workflowService.createWorkflow({
            type: WorkflowType.JOIN_REQUEST,
            data: dtoToRecord(dto)
        })
        return {
            id: workflow.id,
            success: true
        }
    }

    @Post('donate')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Signup' })
    async donate(@Body() dto: DonationFormDto) {
        const workflow = await this.workflowService.createWorkflow({
            type: WorkflowType.DONATION_REQUEST,
            data: dtoToRecord(dto)
        })

        return {
            id: workflow.id,
            success: true
        }
    }

}